use async_trait::async_trait;
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::application::{Application, ApplicationStatus};
use crate::error::{AppError, AppResult};
use crate::repository::convert::{encode_dt, encode_uuid, parse_dt, parse_enum, parse_uuid};
use crate::repository::params::Pagination;
use crate::repository::read::{ApplicantApplication, JobApplication};
use crate::repository::ApplicationRepository;

pub struct PgApplicationRepository {
    pool: PgPool,
}

impl PgApplicationRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct ApplicationRow {
    id: String,
    job_id: String,
    applicant_id: String,
    cover_letter: Option<String>,
    cv_url: Option<String>,
    status: String,
    created_at: String,
    updated_at: String,
}

impl TryFrom<ApplicationRow> for Application {
    type Error = AppError;

    fn try_from(row: ApplicationRow) -> AppResult<Self> {
        Ok(Application {
            id: parse_uuid(&row.id)?,
            job_id: parse_uuid(&row.job_id)?,
            applicant_id: parse_uuid(&row.applicant_id)?,
            cover_letter: row.cover_letter,
            cv_url: row.cv_url,
            status: parse_enum(&row.status)?,
            created_at: parse_dt(&row.created_at)?,
            updated_at: parse_dt(&row.updated_at)?,
        })
    }
}

#[derive(sqlx::FromRow)]
struct JobApplicationRow {
    id: String,
    job_id: String,
    applicant_id: String,
    cover_letter: Option<String>,
    cv_url: Option<String>,
    status: String,
    created_at: String,
    updated_at: String,
    applicant_full_name: String,
    applicant_email: String,
    applicant_phone: Option<String>,
}

impl TryFrom<JobApplicationRow> for JobApplication {
    type Error = AppError;

    fn try_from(row: JobApplicationRow) -> AppResult<Self> {
        Ok(JobApplication {
            application: Application {
                id: parse_uuid(&row.id)?,
                job_id: parse_uuid(&row.job_id)?,
                applicant_id: parse_uuid(&row.applicant_id)?,
                cover_letter: row.cover_letter,
                cv_url: row.cv_url,
                status: parse_enum(&row.status)?,
                created_at: parse_dt(&row.created_at)?,
                updated_at: parse_dt(&row.updated_at)?,
            },
            applicant_full_name: row.applicant_full_name,
            applicant_email: row.applicant_email,
            applicant_phone: row.applicant_phone,
        })
    }
}

#[derive(sqlx::FromRow)]
struct ApplicantApplicationRow {
    id: String,
    job_id: String,
    applicant_id: String,
    cover_letter: Option<String>,
    cv_url: Option<String>,
    status: String,
    created_at: String,
    updated_at: String,
    job_title: String,
    job_city: String,
    business_name: String,
}

impl TryFrom<ApplicantApplicationRow> for ApplicantApplication {
    type Error = AppError;

    fn try_from(row: ApplicantApplicationRow) -> AppResult<Self> {
        Ok(ApplicantApplication {
            application: Application {
                id: parse_uuid(&row.id)?,
                job_id: parse_uuid(&row.job_id)?,
                applicant_id: parse_uuid(&row.applicant_id)?,
                cover_letter: row.cover_letter,
                cv_url: row.cv_url,
                status: parse_enum(&row.status)?,
                created_at: parse_dt(&row.created_at)?,
                updated_at: parse_dt(&row.updated_at)?,
            },
            job_title: row.job_title,
            job_city: row.job_city,
            business_name: row.business_name,
        })
    }
}

#[async_trait]
impl ApplicationRepository for PgApplicationRepository {
    async fn create(&self, application: &Application) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO applications (id, job_id, applicant_id, cover_letter, cv_url, status, \
             created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        )
        .bind(encode_uuid(application.id))
        .bind(encode_uuid(application.job_id))
        .bind(encode_uuid(application.applicant_id))
        .bind(&application.cover_letter)
        .bind(&application.cv_url)
        .bind(application.status.as_str())
        .bind(encode_dt(application.created_at))
        .bind(encode_dt(application.updated_at))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Application>> {
        let row = sqlx::query_as::<_, ApplicationRow>(
            "SELECT id, job_id, applicant_id, cover_letter, cv_url, status, created_at, \
             updated_at FROM applications WHERE id = $1",
        )
        .bind(encode_uuid(id))
        .fetch_optional(&self.pool)
        .await?;
        row.map(Application::try_from).transpose()
    }

    async fn exists(&self, job_id: Uuid, applicant_id: Uuid) -> AppResult<bool> {
        let found: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM applications WHERE job_id = $1 AND applicant_id = $2)",
        )
        .bind(encode_uuid(job_id))
        .bind(encode_uuid(applicant_id))
        .fetch_one(&self.pool)
        .await?;
        Ok(found)
    }

    async fn update_status(&self, id: Uuid, status: ApplicationStatus) -> AppResult<()> {
        sqlx::query("UPDATE applications SET status = $1, updated_at = $2 WHERE id = $3")
            .bind(status.as_str())
            .bind(encode_dt(Utc::now()))
            .bind(encode_uuid(id))
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn list_by_job(
        &self,
        job_id: Uuid,
        page: Pagination,
    ) -> AppResult<(Vec<JobApplication>, i64)> {
        let total: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM applications WHERE job_id = $1")
                .bind(encode_uuid(job_id))
                .fetch_one(&self.pool)
                .await?;

        let rows = sqlx::query_as::<_, JobApplicationRow>(
            "SELECT a.id, a.job_id, a.applicant_id, a.cover_letter, a.cv_url, a.status, \
             a.created_at, a.updated_at, u.full_name AS applicant_full_name, \
             u.email AS applicant_email, u.phone AS applicant_phone \
             FROM applications a JOIN users u ON u.id = a.applicant_id \
             WHERE a.job_id = $1 ORDER BY a.created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(encode_uuid(job_id))
        .bind(page.limit)
        .bind(page.offset)
        .fetch_all(&self.pool)
        .await?;
        let applications = rows
            .into_iter()
            .map(JobApplication::try_from)
            .collect::<AppResult<Vec<_>>>()?;
        Ok((applications, total))
    }

    async fn list_by_applicant(
        &self,
        applicant_id: Uuid,
        page: Pagination,
    ) -> AppResult<(Vec<ApplicantApplication>, i64)> {
        let total: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM applications WHERE applicant_id = $1")
                .bind(encode_uuid(applicant_id))
                .fetch_one(&self.pool)
                .await?;

        let rows = sqlx::query_as::<_, ApplicantApplicationRow>(
            "SELECT a.id, a.job_id, a.applicant_id, a.cover_letter, a.cv_url, a.status, \
             a.created_at, a.updated_at, j.title AS job_title, j.city AS job_city, \
             b.name AS business_name \
             FROM applications a JOIN jobs j ON j.id = a.job_id \
             JOIN businesses b ON b.id = j.business_id \
             WHERE a.applicant_id = $1 ORDER BY a.created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(encode_uuid(applicant_id))
        .bind(page.limit)
        .bind(page.offset)
        .fetch_all(&self.pool)
        .await?;
        let applications = rows
            .into_iter()
            .map(ApplicantApplication::try_from)
            .collect::<AppResult<Vec<_>>>()?;
        Ok((applications, total))
    }
}
