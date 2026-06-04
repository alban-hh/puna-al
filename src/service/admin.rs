use std::sync::Arc;

use chrono::Utc;
use uuid::Uuid;

use crate::domain::business::{Business, BusinessStatus};
use crate::domain::job::Job;
use crate::domain::user::{User, UserStatus};
use crate::dto::admin::{AdminBusinessListQuery, AdminJobListQuery, AdminUserListQuery};
use crate::dto::common::{resolve_pagination, ResolvedPage};
use crate::error::{AppError, AppResult};
use crate::repository::params::{AdminJobQuery, BusinessQuery, PlatformStats, UserQuery};
use crate::repository::{
    BusinessRepository, JobRepository, RefreshTokenRepository, StatsRepository, UserRepository,
};
use crate::service::email::EmailService;
use crate::service::Paged;

pub struct AdminService {
    users: Arc<dyn UserRepository>,
    businesses: Arc<dyn BusinessRepository>,
    jobs: Arc<dyn JobRepository>,
    stats: Arc<dyn StatsRepository>,
    refresh_tokens: Arc<dyn RefreshTokenRepository>,
    email: Arc<EmailService>,
}

impl AdminService {
    pub fn new(
        users: Arc<dyn UserRepository>,
        businesses: Arc<dyn BusinessRepository>,
        jobs: Arc<dyn JobRepository>,
        stats: Arc<dyn StatsRepository>,
        refresh_tokens: Arc<dyn RefreshTokenRepository>,
        email: Arc<EmailService>,
    ) -> Self {
        Self {
            users,
            businesses,
            jobs,
            stats,
            refresh_tokens,
            email,
        }
    }

    pub async fn list_businesses(
        &self,
        query: AdminBusinessListQuery,
    ) -> AppResult<Paged<Business>> {
        let ResolvedPage {
            pagination,
            page,
            per_page,
        } = resolve_pagination(query.page, query.per_page);
        let filter = BusinessQuery {
            status: query.status,
        };
        let (items, total) = self.businesses.list(&filter, pagination).await?;
        Ok(Paged {
            items,
            page,
            per_page,
            total,
        })
    }

    pub async fn approve_business(&self, admin: &User, id: Uuid) -> AppResult<Business> {
        let mut business = self.load_business(id).await?;
        let now = Utc::now();
        business.status = BusinessStatus::Approved;
        business.rejection_reason = None;
        business.approved_at = Some(now);
        business.approved_by = Some(admin.id);
        business.updated_at = now;
        self.businesses.update(&business).await?;

        if let Some(owner) = self.users.find_by_id(business.owner_id).await? {
            self.email
                .send_business_approved(&owner.email, &owner.full_name, &business.name)
                .await?;
        }
        Ok(business)
    }

    pub async fn reject_business(&self, id: Uuid, reason: String) -> AppResult<Business> {
        let mut business = self.load_business(id).await?;
        let now = Utc::now();
        business.status = BusinessStatus::Rejected;
        business.rejection_reason = Some(reason.trim().to_string());
        business.approved_at = None;
        business.approved_by = None;
        business.updated_at = now;
        self.businesses.update(&business).await?;

        if let Some(owner) = self.users.find_by_id(business.owner_id).await? {
            let reason = business.rejection_reason.clone().unwrap_or_default();
            self.email
                .send_business_rejected(&owner.email, &owner.full_name, &business.name, &reason)
                .await?;
        }
        Ok(business)
    }

    pub async fn suspend_business(&self, id: Uuid) -> AppResult<Business> {
        let mut business = self.load_business(id).await?;
        business.status = BusinessStatus::Suspended;
        business.updated_at = Utc::now();
        self.businesses.update(&business).await?;
        Ok(business)
    }

    pub async fn list_users(&self, query: AdminUserListQuery) -> AppResult<Paged<User>> {
        let ResolvedPage {
            pagination,
            page,
            per_page,
        } = resolve_pagination(query.page, query.per_page);
        let filter = UserQuery {
            status: query.status,
            search: query.q.filter(|value| !value.trim().is_empty()),
        };
        let (items, total) = self.users.list(&filter, pagination).await?;
        Ok(Paged {
            items,
            page,
            per_page,
            total,
        })
    }

    pub async fn suspend_user(&self, id: Uuid) -> AppResult<User> {
        let mut user = self
            .users
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("user not found"))?;
        if user.role.is_admin() {
            return Err(AppError::bad_request("admin accounts cannot be suspended"));
        }
        let now = Utc::now();
        user.status = UserStatus::Suspended;
        user.updated_at = now;
        self.users.update(&user).await?;
        self.refresh_tokens
            .revoke_all_for_user(user.id, now)
            .await?;
        Ok(user)
    }

    pub async fn list_jobs(&self, query: AdminJobListQuery) -> AppResult<Paged<Job>> {
        let ResolvedPage {
            pagination,
            page,
            per_page,
        } = resolve_pagination(query.page, query.per_page);
        let filter = AdminJobQuery {
            status: query.status,
            business_id: query.business_id,
        };
        let (items, total) = self.jobs.list_admin(&filter, pagination).await?;
        Ok(Paged {
            items,
            page,
            per_page,
            total,
        })
    }

    pub async fn takedown_job(&self, id: Uuid) -> AppResult<()> {
        let mut job = self
            .jobs
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("job not found"))?;
        let now = Utc::now();
        job.deleted_at = Some(now);
        job.updated_at = now;
        self.jobs.update(&job).await
    }

    pub async fn stats(&self) -> AppResult<PlatformStats> {
        self.stats.platform_stats().await
    }

    async fn load_business(&self, id: Uuid) -> AppResult<Business> {
        self.businesses
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("business not found"))
    }
}
