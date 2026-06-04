use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::business::BusinessStatus;
use crate::domain::job::JobStatus;
use crate::domain::user::UserStatus;
use crate::repository::params::PlatformStats;

#[derive(Debug, Deserialize, Validate)]
pub struct RejectBusinessRequest {
    #[validate(length(min = 3, max = 1000, message = "must be between 3 and 1000 characters"))]
    pub reason: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AdminBusinessListQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<BusinessStatus>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AdminUserListQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<UserStatus>,
    pub q: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct AdminJobListQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<JobStatus>,
    pub business_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct StatsResponse {
    pub total_users: i64,
    pub suspended_users: i64,
    pub total_businesses: i64,
    pub pending_businesses: i64,
    pub approved_businesses: i64,
    pub total_jobs: i64,
    pub published_jobs: i64,
    pub total_applications: i64,
}

impl From<PlatformStats> for StatsResponse {
    fn from(stats: PlatformStats) -> Self {
        Self {
            total_users: stats.total_users,
            suspended_users: stats.suspended_users,
            total_businesses: stats.total_businesses,
            pending_businesses: stats.pending_businesses,
            approved_businesses: stats.approved_businesses,
            total_jobs: stats.total_jobs,
            published_jobs: stats.published_jobs,
            total_applications: stats.total_applications,
        }
    }
}
