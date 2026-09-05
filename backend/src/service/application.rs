use std::sync::Arc;

use chrono::Utc;
use uuid::Uuid;

use crate::domain::application::{Application, ApplicationStatus};
use crate::domain::job::Job;
use crate::domain::user::User;
use crate::dto::application::CreateApplicationRequest;
use crate::dto::common::{resolve_pagination, ResolvedPage};
use crate::error::{AppError, AppResult};
use crate::repository::read::{ApplicantApplication, JobApplication};
use crate::repository::{ApplicationRepository, BusinessRepository, JobRepository, UserRepository};
use crate::service::email::EmailService;

pub struct ApplicationService {
    applications: Arc<dyn ApplicationRepository>,
    jobs: Arc<dyn JobRepository>,
    businesses: Arc<dyn BusinessRepository>,
    users: Arc<dyn UserRepository>,
    email: Arc<EmailService>,
}

pub struct ApplicantApplicationsPage {
    pub items: Vec<ApplicantApplication>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

pub struct JobApplicationsPage {
    pub items: Vec<JobApplication>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

impl ApplicationService {
    pub fn new(
        applications: Arc<dyn ApplicationRepository>,
        jobs: Arc<dyn JobRepository>,
        businesses: Arc<dyn BusinessRepository>,
        users: Arc<dyn UserRepository>,
        email: Arc<EmailService>,
    ) -> Self {
        Self {
            applications,
            jobs,
            businesses,
            users,
            email,
        }
    }

    pub async fn apply(
        &self,
        applicant: &User,
        job_id: Uuid,
        request: CreateApplicationRequest,
    ) -> AppResult<Application> {
        let job = self
            .jobs
            .find_by_id(job_id)
            .await?
            .ok_or_else(|| AppError::not_found("job not found"))?;
        if !job.is_published() {
            return Err(AppError::bad_request(
                "this job is not open for applications",
            ));
        }

        let business = self
            .businesses
            .find_by_id(job.business_id)
            .await?
            .ok_or_else(|| AppError::not_found("job not found"))?;
        if business.owner_id == applicant.id {
            return Err(AppError::Forbidden);
        }

        if self.applications.exists(job_id, applicant.id).await? {
            return Err(AppError::conflict("you have already applied to this job"));
        }

        let now = Utc::now();
        let application = Application {
            id: Uuid::now_v7(),
            job_id,
            applicant_id: applicant.id,
            cover_letter: request
                .cover_letter
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty()),
            cv_url: request.cv_url.map(|value| value.trim().to_string()),
            status: ApplicationStatus::Submitted,
            created_at: now,
            updated_at: now,
        };
        self.applications.create(&application).await?;

        if let Some(owner) = self.users.find_by_id(business.owner_id).await? {
            self.email
                .send_application_received(
                    &owner.email,
                    &owner.full_name,
                    &job.title,
                    &applicant.full_name,
                )
                .await?;
        }
        Ok(application)
    }

    pub async fn list_mine(
        &self,
        applicant_id: Uuid,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<ApplicantApplicationsPage> {
        let ResolvedPage {
            pagination,
            page,
            per_page,
        } = resolve_pagination(page, per_page);
        let (items, total) = self
            .applications
            .list_by_applicant(applicant_id, pagination)
            .await?;
        Ok(ApplicantApplicationsPage {
            items,
            page,
            per_page,
            total,
        })
    }

    pub async fn list_for_job(
        &self,
        job_id: Uuid,
        owner: &User,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<JobApplicationsPage> {
        self.load_owned_job(job_id, owner).await?;
        let ResolvedPage {
            pagination,
            page,
            per_page,
        } = resolve_pagination(page, per_page);
        let (items, total) = self.applications.list_by_job(job_id, pagination).await?;
        Ok(JobApplicationsPage {
            items,
            page,
            per_page,
            total,
        })
    }

    pub async fn update_status(
        &self,
        application_id: Uuid,
        owner: &User,
        status: ApplicationStatus,
    ) -> AppResult<Application> {
        let mut application = self
            .applications
            .find_by_id(application_id)
            .await?
            .ok_or_else(|| AppError::not_found("application not found"))?;
        self.load_owned_job(application.job_id, owner).await?;

        self.applications
            .update_status(application_id, status)
            .await?;
        application.status = status;
        application.updated_at = Utc::now();
        Ok(application)
    }

    async fn load_owned_job(&self, job_id: Uuid, owner: &User) -> AppResult<Job> {
        let job = self
            .jobs
            .find_by_id(job_id)
            .await?
            .ok_or_else(|| AppError::not_found("job not found"))?;
        let business = self
            .businesses
            .find_by_id(job.business_id)
            .await?
            .ok_or_else(|| AppError::not_found("job not found"))?;
        if business.owner_id != owner.id {
            return Err(AppError::Forbidden);
        }
        Ok(job)
    }
}
