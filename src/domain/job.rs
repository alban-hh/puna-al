use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::category::Category;
use crate::domain::qark::Qark;
use crate::string_enum;

string_enum!(EmploymentType {
    FullTime => "full_time",
    PartTime => "part_time",
    Contract => "contract",
    Internship => "internship",
    Temporary => "temporary",
});

string_enum!(SalaryPeriod {
    Month => "month",
    Year => "year",
});

string_enum!(JobStatus {
    Draft => "draft",
    Published => "published",
    Closed => "closed",
    Expired => "expired",
});

#[derive(Debug, Clone)]
pub struct Job {
    pub id: Uuid,
    pub business_id: Uuid,
    pub title: String,
    pub description: String,
    pub category: Category,
    pub employment_type: EmploymentType,
    pub qark: Qark,
    pub city: String,
    pub remote: bool,
    pub salary_min: Option<i64>,
    pub salary_max: Option<i64>,
    pub salary_period: Option<SalaryPeriod>,
    pub status: JobStatus,
    pub featured_until: Option<DateTime<Utc>>,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Job {
    pub fn is_published(&self) -> bool {
        matches!(self.status, JobStatus::Published)
    }

    pub fn is_featured_at(&self, now: DateTime<Utc>) -> bool {
        self.featured_until.is_some_and(|until| until > now)
    }
}
