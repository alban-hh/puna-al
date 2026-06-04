pub mod params;
pub mod read;
pub mod sqlite;

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::application::{Application, ApplicationStatus};
use crate::domain::business::Business;
use crate::domain::job::Job;
use crate::domain::refresh_token::RefreshToken;
use crate::domain::token::{TokenPurpose, VerificationToken};
use crate::domain::user::User;
use crate::error::AppResult;
use crate::repository::params::{
    AdminJobQuery, BusinessQuery, JobQuery, Pagination, PlatformStats, UserQuery,
};
use crate::repository::read::{ApplicantApplication, JobApplication};

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(&self, user: &User) -> AppResult<()>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<User>>;
    async fn find_by_email(&self, email: &str) -> AppResult<Option<User>>;
    async fn update(&self, user: &User) -> AppResult<()>;
    async fn count_admins(&self) -> AppResult<i64>;
    async fn list(&self, query: &UserQuery, page: Pagination) -> AppResult<(Vec<User>, i64)>;
}

#[async_trait]
pub trait BusinessRepository: Send + Sync {
    async fn create(&self, business: &Business) -> AppResult<()>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Business>>;
    async fn find_by_nipt(&self, nipt: &str) -> AppResult<Option<Business>>;
    async fn list_by_owner(&self, owner_id: Uuid) -> AppResult<Vec<Business>>;
    async fn update(&self, business: &Business) -> AppResult<()>;
    async fn list(
        &self,
        query: &BusinessQuery,
        page: Pagination,
    ) -> AppResult<(Vec<Business>, i64)>;
}

#[async_trait]
pub trait JobRepository: Send + Sync {
    async fn create(&self, job: &Job) -> AppResult<()>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Job>>;
    async fn update(&self, job: &Job) -> AppResult<()>;
    async fn list_public(&self, query: &JobQuery, page: Pagination) -> AppResult<(Vec<Job>, i64)>;
    async fn list_by_business(
        &self,
        business_id: Uuid,
        page: Pagination,
    ) -> AppResult<(Vec<Job>, i64)>;
    async fn list_admin(
        &self,
        query: &AdminJobQuery,
        page: Pagination,
    ) -> AppResult<(Vec<Job>, i64)>;
    async fn expire_due(&self, now: DateTime<Utc>) -> AppResult<u64>;
}

#[async_trait]
pub trait ApplicationRepository: Send + Sync {
    async fn create(&self, application: &Application) -> AppResult<()>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Application>>;
    async fn exists(&self, job_id: Uuid, applicant_id: Uuid) -> AppResult<bool>;
    async fn update_status(&self, id: Uuid, status: ApplicationStatus) -> AppResult<()>;
    async fn list_by_job(
        &self,
        job_id: Uuid,
        page: Pagination,
    ) -> AppResult<(Vec<JobApplication>, i64)>;
    async fn list_by_applicant(
        &self,
        applicant_id: Uuid,
        page: Pagination,
    ) -> AppResult<(Vec<ApplicantApplication>, i64)>;
}

#[async_trait]
pub trait TokenRepository: Send + Sync {
    async fn create(&self, token: &VerificationToken) -> AppResult<()>;
    async fn find_active_by_hash(
        &self,
        token_hash: &str,
        purpose: TokenPurpose,
        now: DateTime<Utc>,
    ) -> AppResult<Option<VerificationToken>>;
    async fn mark_used(&self, id: Uuid, used_at: DateTime<Utc>) -> AppResult<()>;
    async fn invalidate_for_user(
        &self,
        user_id: Uuid,
        purpose: TokenPurpose,
        used_at: DateTime<Utc>,
    ) -> AppResult<()>;
}

#[async_trait]
pub trait RefreshTokenRepository: Send + Sync {
    async fn create(&self, token: &RefreshToken) -> AppResult<()>;
    async fn find_active_by_hash(
        &self,
        token_hash: &str,
        now: DateTime<Utc>,
    ) -> AppResult<Option<RefreshToken>>;
    async fn revoke(&self, id: Uuid, revoked_at: DateTime<Utc>) -> AppResult<()>;
    async fn revoke_all_for_user(&self, user_id: Uuid, revoked_at: DateTime<Utc>) -> AppResult<()>;
}

#[async_trait]
pub trait StatsRepository: Send + Sync {
    async fn platform_stats(&self) -> AppResult<PlatformStats>;
}
