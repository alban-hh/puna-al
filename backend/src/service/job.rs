use std::sync::Arc;

use chrono::{Duration, Utc};
use uuid::Uuid;

use crate::domain::business::Business;
use crate::domain::job::{Job, JobStatus};
use crate::domain::user::User;
use crate::dto::common::{resolve_pagination, ResolvedPage};
use crate::dto::job::{CreateJobRequest, JobListQuery, PromoteJobRequest, UpdateJobRequest};
use crate::error::{AppError, AppResult};
use crate::repository::params::{JobQuery, JobSort};
use crate::repository::{BusinessRepository, JobRepository};

const DEFAULT_PUBLISH_DURATION_DAYS: i64 = 30;

pub struct JobService {
    jobs: Arc<dyn JobRepository>,
    businesses: Arc<dyn BusinessRepository>,
}

pub struct JobPage {
    pub jobs: Vec<Job>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

impl JobService {
    pub fn new(jobs: Arc<dyn JobRepository>, businesses: Arc<dyn BusinessRepository>) -> Self {
        Self { jobs, businesses }
    }

    pub async fn create(&self, owner: &User, request: CreateJobRequest) -> AppResult<Job> {
        let business = self.load_owned_business(request.business_id, owner).await?;
        if !business.is_approved() {
            return Err(AppError::Forbidden);
        }
        validate_salary(
            request.salary_min,
            request.salary_max,
            request.salary_period.is_some(),
        )?;

        let now = Utc::now();
        let job = Job {
            id: Uuid::now_v7(),
            business_id: business.id,
            title: request.title.trim().to_string(),
            description: request.description.trim().to_string(),
            category: request.category,
            employment_type: request.employment_type,
            qark: request.qark,
            city: request.city.trim().to_string(),
            remote: request.remote,
            salary_min: request.salary_min,
            salary_max: request.salary_max,
            salary_period: request.salary_period,
            status: JobStatus::Draft,
            featured_until: None,
            published_at: None,
            expires_at: request.expires_at,
            deleted_at: None,
            created_at: now,
            updated_at: now,
        };
        self.jobs.create(&job).await?;
        Ok(job)
    }

    pub async fn view_public(&self, id: Uuid) -> AppResult<Job> {
        let job = self.load_existing(id).await?;
        if job.status == JobStatus::Draft {
            return Err(AppError::not_found("job not found"));
        }
        Ok(job)
    }

    pub async fn list_public(&self, query: JobListQuery) -> AppResult<JobPage> {
        let ResolvedPage {
            pagination,
            page,
            per_page,
        } = resolve_pagination(query.page, query.per_page);

        let filter = JobQuery {
            search: query.q.filter(|value| !value.trim().is_empty()),
            category: query.category,
            qark: query.qark,
            city: query.city.filter(|value| !value.trim().is_empty()),
            employment_type: query.employment_type,
            remote: query.remote,
            featured_only: query.featured.unwrap_or(false),
            sort: parse_sort(query.sort.as_deref()),
            now: Utc::now(),
        };

        let (jobs, total) = self.jobs.list_public(&filter, pagination).await?;
        Ok(JobPage {
            jobs,
            page,
            per_page,
            total,
        })
    }

    pub async fn list_for_owner(
        &self,
        business_id: Uuid,
        owner: &User,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<JobPage> {
        self.load_owned_business(business_id, owner).await?;
        let ResolvedPage {
            pagination,
            page,
            per_page,
        } = resolve_pagination(page, per_page);
        let (jobs, total) = self.jobs.list_by_business(business_id, pagination).await?;
        Ok(JobPage {
            jobs,
            page,
            per_page,
            total,
        })
    }

    pub async fn update(
        &self,
        id: Uuid,
        owner: &User,
        request: UpdateJobRequest,
    ) -> AppResult<Job> {
        let (mut job, _) = self.load_owned_job(id, owner).await?;

        if let Some(title) = request.title {
            job.title = title.trim().to_string();
        }
        if let Some(description) = request.description {
            job.description = description.trim().to_string();
        }
        if let Some(category) = request.category {
            job.category = category;
        }
        if let Some(employment_type) = request.employment_type {
            job.employment_type = employment_type;
        }
        if let Some(qark) = request.qark {
            job.qark = qark;
        }
        if let Some(city) = request.city {
            job.city = city.trim().to_string();
        }
        if let Some(remote) = request.remote {
            job.remote = remote;
        }
        if let Some(salary_min) = request.salary_min {
            job.salary_min = Some(salary_min);
        }
        if let Some(salary_max) = request.salary_max {
            job.salary_max = Some(salary_max);
        }
        if let Some(salary_period) = request.salary_period {
            job.salary_period = Some(salary_period);
        }
        if let Some(expires_at) = request.expires_at {
            job.expires_at = Some(expires_at);
        }

        validate_salary(job.salary_min, job.salary_max, job.salary_period.is_some())?;
        job.updated_at = Utc::now();
        self.jobs.update(&job).await?;
        Ok(job)
    }

    pub async fn soft_delete(&self, id: Uuid, owner: &User) -> AppResult<()> {
        let (mut job, _) = self.load_owned_job(id, owner).await?;
        let now = Utc::now();
        job.deleted_at = Some(now);
        job.updated_at = now;
        self.jobs.update(&job).await
    }

    pub async fn publish(&self, id: Uuid, owner: &User) -> AppResult<Job> {
        let (mut job, business) = self.load_owned_job(id, owner).await?;
        if !business.is_approved() {
            return Err(AppError::Forbidden);
        }
        let now = Utc::now();
        job.status = JobStatus::Published;
        if job.published_at.is_none() {
            job.published_at = Some(now);
        }
        if job.expires_at.is_none() {
            job.expires_at = Some(now + Duration::days(DEFAULT_PUBLISH_DURATION_DAYS));
        }
        job.updated_at = now;
        self.jobs.update(&job).await?;
        Ok(job)
    }

    pub async fn close(&self, id: Uuid, owner: &User) -> AppResult<Job> {
        let (mut job, _) = self.load_owned_job(id, owner).await?;
        job.status = JobStatus::Closed;
        job.updated_at = Utc::now();
        self.jobs.update(&job).await?;
        Ok(job)
    }

    pub async fn promote(
        &self,
        id: Uuid,
        owner: &User,
        request: PromoteJobRequest,
    ) -> AppResult<Job> {
        let (mut job, business) = self.load_owned_job(id, owner).await?;
        if !business.is_approved() {
            return Err(AppError::Forbidden);
        }
        if !job.is_published() {
            return Err(AppError::bad_request("only published jobs can be promoted"));
        }
        let now = Utc::now();
        let start = job
            .featured_until
            .filter(|until| *until > now)
            .unwrap_or(now);
        job.featured_until = Some(start + Duration::days(request.days));
        job.updated_at = now;
        self.jobs.update(&job).await?;
        Ok(job)
    }

    async fn load_existing(&self, id: Uuid) -> AppResult<Job> {
        self.jobs
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("job not found"))
    }

    async fn load_owned_job(&self, id: Uuid, owner: &User) -> AppResult<(Job, Business)> {
        let job = self.load_existing(id).await?;
        let business = self
            .businesses
            .find_by_id(job.business_id)
            .await?
            .ok_or_else(|| AppError::not_found("job not found"))?;
        if business.owner_id != owner.id {
            return Err(AppError::Forbidden);
        }
        Ok((job, business))
    }

    async fn load_owned_business(&self, id: Uuid, owner: &User) -> AppResult<Business> {
        let business = self
            .businesses
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::not_found("business not found"))?;
        if business.owner_id != owner.id {
            return Err(AppError::Forbidden);
        }
        Ok(business)
    }
}

fn validate_salary(min: Option<i64>, max: Option<i64>, has_period: bool) -> AppResult<()> {
    if (min.is_some() || max.is_some()) && !has_period {
        return Err(AppError::bad_request(
            "salary_period is required when a salary range is provided",
        ));
    }
    if let (Some(min), Some(max)) = (min, max) {
        if max < min {
            return Err(AppError::bad_request(
                "salary_max must be greater than or equal to salary_min",
            ));
        }
    }
    Ok(())
}

fn parse_sort(sort: Option<&str>) -> JobSort {
    match sort {
        Some("oldest") => JobSort::Oldest,
        Some("salary_high") => JobSort::SalaryHigh,
        Some("salary_low") => JobSort::SalaryLow,
        _ => JobSort::Newest,
    }
}
