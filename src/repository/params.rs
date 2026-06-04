use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::business::BusinessStatus;
use crate::domain::category::Category;
use crate::domain::job::{EmploymentType, JobStatus};
use crate::domain::qark::Qark;
use crate::domain::user::UserStatus;

#[derive(Debug, Clone, Copy)]
pub struct Pagination {
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone, Copy)]
pub enum JobSort {
    Newest,
    Oldest,
    SalaryHigh,
    SalaryLow,
}

#[derive(Debug, Clone)]
pub struct JobQuery {
    pub search: Option<String>,
    pub category: Option<Category>,
    pub qark: Option<Qark>,
    pub city: Option<String>,
    pub employment_type: Option<EmploymentType>,
    pub remote: Option<bool>,
    pub featured_only: bool,
    pub sort: JobSort,
    pub now: DateTime<Utc>,
}

#[derive(Debug, Clone, Default)]
pub struct UserQuery {
    pub status: Option<UserStatus>,
    pub search: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct BusinessQuery {
    pub status: Option<BusinessStatus>,
}

#[derive(Debug, Clone, Default)]
pub struct AdminJobQuery {
    pub status: Option<JobStatus>,
    pub business_id: Option<Uuid>,
}

#[derive(Debug, Clone)]
pub struct PlatformStats {
    pub total_users: i64,
    pub suspended_users: i64,
    pub total_businesses: i64,
    pub pending_businesses: i64,
    pub approved_businesses: i64,
    pub total_jobs: i64,
    pub published_jobs: i64,
    pub total_applications: i64,
}
