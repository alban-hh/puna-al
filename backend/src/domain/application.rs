use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::string_enum;

string_enum!(ApplicationStatus {
    Submitted => "submitted",
    Reviewed => "reviewed",
    Shortlisted => "shortlisted",
    Rejected => "rejected",
    Hired => "hired",
});

#[derive(Debug, Clone)]
pub struct Application {
    pub id: Uuid,
    pub job_id: Uuid,
    pub applicant_id: Uuid,
    pub cover_letter: Option<String>,
    pub cv_url: Option<String>,
    pub status: ApplicationStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
