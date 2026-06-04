use std::sync::Arc;

use chrono::Utc;
use uuid::Uuid;

use crate::domain::business::{Business, BusinessStatus};
use crate::domain::user::User;
use crate::dto::business::{CreateBusinessRequest, UpdateBusinessRequest};
use crate::error::{AppError, AppResult};
use crate::repository::BusinessRepository;
use crate::service::email::EmailService;

pub struct BusinessService {
    businesses: Arc<dyn BusinessRepository>,
    email: Arc<EmailService>,
}

impl BusinessService {
    pub fn new(businesses: Arc<dyn BusinessRepository>, email: Arc<EmailService>) -> Self {
        Self { businesses, email }
    }

    pub async fn create(
        &self,
        owner: &User,
        request: CreateBusinessRequest,
    ) -> AppResult<Business> {
        let nipt = request.nipt.trim().to_uppercase();
        if self.businesses.find_by_nipt(&nipt).await?.is_some() {
            return Err(AppError::conflict(
                "a business with this NIPT already exists",
            ));
        }

        let now = Utc::now();
        let business = Business {
            id: Uuid::now_v7(),
            owner_id: owner.id,
            name: request.name.trim().to_string(),
            nipt,
            description: request.description.trim().to_string(),
            qark: request.qark,
            city: request.city.trim().to_string(),
            address: request.address.trim().to_string(),
            phone: request.phone.trim().to_string(),
            website: request.website.map(|value| value.trim().to_string()),
            logo_url: request.logo_url.map(|value| value.trim().to_string()),
            status: BusinessStatus::Pending,
            rejection_reason: None,
            approved_at: None,
            approved_by: None,
            created_at: now,
            updated_at: now,
        };
        self.businesses.create(&business).await?;
        self.email
            .send_business_submitted(&owner.email, &owner.full_name, &business.name)
            .await?;
        Ok(business)
    }

    pub async fn list_mine(&self, owner_id: Uuid) -> AppResult<Vec<Business>> {
        self.businesses.list_by_owner(owner_id).await
    }

    pub async fn view(&self, id: Uuid, viewer: Option<&User>) -> AppResult<Business> {
        let business = self
            .businesses
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("business not found"))?;

        if business.is_visible_publicly() {
            return Ok(business);
        }
        match viewer {
            Some(user) if user.id == business.owner_id || user.role.is_admin() => Ok(business),
            _ => Err(AppError::not_found("business not found")),
        }
    }

    pub async fn update(
        &self,
        id: Uuid,
        owner: &User,
        request: UpdateBusinessRequest,
    ) -> AppResult<Business> {
        let mut business = self.load_owned(id, owner).await?;

        if let Some(name) = request.name {
            business.name = name.trim().to_string();
        }
        if let Some(description) = request.description {
            business.description = description.trim().to_string();
        }
        if let Some(qark) = request.qark {
            business.qark = qark;
        }
        if let Some(city) = request.city {
            business.city = city.trim().to_string();
        }
        if let Some(address) = request.address {
            business.address = address.trim().to_string();
        }
        if let Some(phone) = request.phone {
            business.phone = phone.trim().to_string();
        }
        if let Some(website) = request.website {
            business.website = Some(website.trim().to_string());
        }
        if let Some(logo_url) = request.logo_url {
            business.logo_url = Some(logo_url.trim().to_string());
        }

        let resubmitted = business.status == BusinessStatus::Rejected;
        if resubmitted {
            business.status = BusinessStatus::Pending;
            business.rejection_reason = None;
        }
        business.updated_at = Utc::now();
        self.businesses.update(&business).await?;

        if resubmitted {
            self.email
                .send_business_submitted(&owner.email, &owner.full_name, &business.name)
                .await?;
        }
        Ok(business)
    }

    async fn load_owned(&self, id: Uuid, owner: &User) -> AppResult<Business> {
        let business = self
            .businesses
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("business not found"))?;
        if business.owner_id != owner.id {
            return Err(AppError::Forbidden);
        }
        Ok(business)
    }
}
