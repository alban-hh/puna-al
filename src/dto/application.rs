use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::application::{Application, ApplicationStatus};
use crate::repository::read::{ApplicantApplication, JobApplication};

#[derive(Debug, Deserialize, Validate)]
pub struct CreateApplicationRequest {
    #[validate(length(max = 5000, message = "must be at most 5000 characters"))]
    pub cover_letter: Option<String>,
    #[validate(url(message = "must be a valid URL"))]
    pub cv_url: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateApplicationStatusRequest {
    pub status: ApplicationStatus,
}

#[derive(Debug, Serialize)]
pub struct ApplicationResponse {
    pub id: Uuid,
    pub job_id: Uuid,
    pub applicant_id: Uuid,
    pub cover_letter: Option<String>,
    pub cv_url: Option<String>,
    pub status: ApplicationStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<&Application> for ApplicationResponse {
    fn from(application: &Application) -> Self {
        Self {
            id: application.id,
            job_id: application.job_id,
            applicant_id: application.applicant_id,
            cover_letter: application.cover_letter.clone(),
            cv_url: application.cv_url.clone(),
            status: application.status,
            created_at: application.created_at,
            updated_at: application.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ApplicantSummary {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct JobApplicationResponse {
    #[serde(flatten)]
    pub application: ApplicationResponse,
    pub applicant: ApplicantSummary,
}

impl From<&JobApplication> for JobApplicationResponse {
    fn from(value: &JobApplication) -> Self {
        Self {
            application: ApplicationResponse::from(&value.application),
            applicant: ApplicantSummary {
                id: value.application.applicant_id,
                full_name: value.applicant_full_name.clone(),
                email: value.applicant_email.clone(),
                phone: value.applicant_phone.clone(),
            },
        }
    }
}

#[derive(Debug, Serialize)]
pub struct JobSummary {
    pub id: Uuid,
    pub title: String,
    pub city: String,
    pub business_name: String,
}

#[derive(Debug, Serialize)]
pub struct ApplicantApplicationResponse {
    #[serde(flatten)]
    pub application: ApplicationResponse,
    pub job: JobSummary,
}

impl From<&ApplicantApplication> for ApplicantApplicationResponse {
    fn from(value: &ApplicantApplication) -> Self {
        Self {
            application: ApplicationResponse::from(&value.application),
            job: JobSummary {
                id: value.application.job_id,
                title: value.job_title.clone(),
                city: value.job_city.clone(),
                business_name: value.business_name.clone(),
            },
        }
    }
}
