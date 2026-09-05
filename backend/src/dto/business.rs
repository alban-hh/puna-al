use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::business::{Business, BusinessStatus};
use crate::domain::qark::Qark;
use crate::dto::validators::{albanian_phone, nipt};

#[derive(Debug, Deserialize, Validate)]
pub struct CreateBusinessRequest {
    #[validate(length(min = 2, max = 160, message = "must be between 2 and 160 characters"))]
    pub name: String,
    #[validate(custom(function = "nipt"))]
    pub nipt: String,
    #[validate(length(
        min = 10,
        max = 5000,
        message = "must be between 10 and 5000 characters"
    ))]
    pub description: String,
    pub qark: Qark,
    #[validate(length(min = 2, max = 120, message = "must be between 2 and 120 characters"))]
    pub city: String,
    #[validate(length(min = 5, max = 240, message = "must be between 5 and 240 characters"))]
    pub address: String,
    #[validate(custom(function = "albanian_phone"))]
    pub phone: String,
    #[validate(url(message = "must be a valid URL"))]
    pub website: Option<String>,
    #[validate(url(message = "must be a valid URL"))]
    pub logo_url: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateBusinessRequest {
    #[validate(length(min = 2, max = 160, message = "must be between 2 and 160 characters"))]
    pub name: Option<String>,
    #[validate(length(
        min = 10,
        max = 5000,
        message = "must be between 10 and 5000 characters"
    ))]
    pub description: Option<String>,
    pub qark: Option<Qark>,
    #[validate(length(min = 2, max = 120, message = "must be between 2 and 120 characters"))]
    pub city: Option<String>,
    #[validate(length(min = 5, max = 240, message = "must be between 5 and 240 characters"))]
    pub address: Option<String>,
    #[validate(custom(function = "albanian_phone"))]
    pub phone: Option<String>,
    #[validate(url(message = "must be a valid URL"))]
    pub website: Option<String>,
    #[validate(url(message = "must be a valid URL"))]
    pub logo_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct BusinessResponse {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub name: String,
    pub nipt: String,
    pub description: String,
    pub qark: Qark,
    pub city: String,
    pub address: String,
    pub phone: String,
    pub website: Option<String>,
    pub logo_url: Option<String>,
    pub status: BusinessStatus,
    pub rejection_reason: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<&Business> for BusinessResponse {
    fn from(business: &Business) -> Self {
        Self {
            id: business.id,
            owner_id: business.owner_id,
            name: business.name.clone(),
            nipt: business.nipt.clone(),
            description: business.description.clone(),
            qark: business.qark,
            city: business.city.clone(),
            address: business.address.clone(),
            phone: business.phone.clone(),
            website: business.website.clone(),
            logo_url: business.logo_url.clone(),
            status: business.status,
            rejection_reason: business.rejection_reason.clone(),
            approved_at: business.approved_at,
            created_at: business.created_at,
            updated_at: business.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct BusinessSummary {
    pub id: Uuid,
    pub name: String,
    pub qark: Qark,
    pub city: String,
    pub website: Option<String>,
    pub logo_url: Option<String>,
}

impl From<&Business> for BusinessSummary {
    fn from(business: &Business) -> Self {
        Self {
            id: business.id,
            name: business.name.clone(),
            qark: business.qark,
            city: business.city.clone(),
            website: business.website.clone(),
            logo_url: business.logo_url.clone(),
        }
    }
}
