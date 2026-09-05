use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::category::Category;
use crate::domain::job::{EmploymentType, Job, JobStatus, SalaryPeriod};
use crate::domain::qark::Qark;
use crate::dto::business::BusinessSummary;

const SALARY_CURRENCY: &str = "ALL";

#[derive(Debug, Deserialize, Validate)]
pub struct CreateJobRequest {
    pub business_id: Uuid,
    #[validate(length(min = 3, max = 160, message = "must be between 3 and 160 characters"))]
    pub title: String,
    #[validate(length(
        min = 20,
        max = 10000,
        message = "must be between 20 and 10000 characters"
    ))]
    pub description: String,
    pub category: Category,
    pub employment_type: EmploymentType,
    pub qark: Qark,
    #[validate(length(min = 2, max = 120, message = "must be between 2 and 120 characters"))]
    pub city: String,
    #[serde(default)]
    pub remote: bool,
    #[validate(range(min = 0, message = "must not be negative"))]
    pub salary_min: Option<i64>,
    #[validate(range(min = 0, message = "must not be negative"))]
    pub salary_max: Option<i64>,
    pub salary_period: Option<SalaryPeriod>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateJobRequest {
    #[validate(length(min = 3, max = 160, message = "must be between 3 and 160 characters"))]
    pub title: Option<String>,
    #[validate(length(
        min = 20,
        max = 10000,
        message = "must be between 20 and 10000 characters"
    ))]
    pub description: Option<String>,
    pub category: Option<Category>,
    pub employment_type: Option<EmploymentType>,
    pub qark: Option<Qark>,
    #[validate(length(min = 2, max = 120, message = "must be between 2 and 120 characters"))]
    pub city: Option<String>,
    pub remote: Option<bool>,
    #[validate(range(min = 0, message = "must not be negative"))]
    pub salary_min: Option<i64>,
    #[validate(range(min = 0, message = "must not be negative"))]
    pub salary_max: Option<i64>,
    pub salary_period: Option<SalaryPeriod>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct PromoteJobRequest {
    #[validate(range(min = 1, max = 90, message = "must be between 1 and 90 days"))]
    pub days: i64,
}

#[derive(Debug, Deserialize, Validate)]
pub struct JobListQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub q: Option<String>,
    pub category: Option<Category>,
    pub qark: Option<Qark>,
    pub employment_type: Option<EmploymentType>,
    pub city: Option<String>,
    pub remote: Option<bool>,
    pub featured: Option<bool>,
    pub sort: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct JobResponse {
    pub id: Uuid,
    pub business_id: Uuid,
    pub title: String,
    pub description: String,
    pub category: Category,
    pub category_label: &'static str,
    pub employment_type: EmploymentType,
    pub qark: Qark,
    pub city: String,
    pub remote: bool,
    pub salary_min: Option<i64>,
    pub salary_max: Option<i64>,
    pub salary_period: Option<SalaryPeriod>,
    pub salary_currency: &'static str,
    pub status: JobStatus,
    pub featured: bool,
    pub featured_until: Option<DateTime<Utc>>,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<&Job> for JobResponse {
    fn from(job: &Job) -> Self {
        Self {
            id: job.id,
            business_id: job.business_id,
            title: job.title.clone(),
            description: job.description.clone(),
            category: job.category,
            category_label: job.category.label_sq(),
            employment_type: job.employment_type,
            qark: job.qark,
            city: job.city.clone(),
            remote: job.remote,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_period: job.salary_period,
            salary_currency: SALARY_CURRENCY,
            status: job.status,
            featured: job.is_featured_at(Utc::now()),
            featured_until: job.featured_until,
            published_at: job.published_at,
            expires_at: job.expires_at,
            created_at: job.created_at,
            updated_at: job.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct JobDetailResponse {
    #[serde(flatten)]
    pub job: JobResponse,
    pub business: BusinessSummary,
}
