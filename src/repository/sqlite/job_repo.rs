use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use uuid::Uuid;

use crate::domain::job::Job;
use crate::error::{AppError, AppResult};
use crate::repository::params::{AdminJobQuery, JobQuery, JobSort, Pagination};
use crate::repository::sqlite::convert::{
    encode_dt, encode_opt_dt, encode_uuid, parse_dt, parse_enum, parse_opt_dt, parse_uuid,
};
use crate::repository::JobRepository;

pub struct SqliteJobRepository {
    pool: SqlitePool,
}

impl SqliteJobRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct JobRow {
    id: String,
    business_id: String,
    title: String,
    description: String,
    category: String,
    employment_type: String,
    qark: String,
    city: String,
    remote: bool,
    salary_min: Option<i64>,
    salary_max: Option<i64>,
    salary_period: Option<String>,
    status: String,
    featured_until: Option<String>,
    published_at: Option<String>,
    expires_at: Option<String>,
    deleted_at: Option<String>,
    created_at: String,
    updated_at: String,
}

impl TryFrom<JobRow> for Job {
    type Error = AppError;

    fn try_from(row: JobRow) -> AppResult<Self> {
        Ok(Job {
            id: parse_uuid(&row.id)?,
            business_id: parse_uuid(&row.business_id)?,
            title: row.title,
            description: row.description,
            category: parse_enum(&row.category)?,
            employment_type: parse_enum(&row.employment_type)?,
            qark: parse_enum(&row.qark)?,
            city: row.city,
            remote: row.remote,
            salary_min: row.salary_min,
            salary_max: row.salary_max,
            salary_period: row.salary_period.as_deref().map(parse_enum).transpose()?,
            status: parse_enum(&row.status)?,
            featured_until: parse_opt_dt(row.featured_until)?,
            published_at: parse_opt_dt(row.published_at)?,
            expires_at: parse_opt_dt(row.expires_at)?,
            deleted_at: parse_opt_dt(row.deleted_at)?,
            created_at: parse_dt(&row.created_at)?,
            updated_at: parse_dt(&row.updated_at)?,
        })
    }
}

const COLUMNS: &str = "id, business_id, title, description, category, employment_type, qark, \
    city, remote, salary_min, salary_max, salary_period, status, featured_until, published_at, \
    expires_at, deleted_at, created_at, updated_at";

fn push_public_filters(builder: &mut QueryBuilder<'_, Sqlite>, query: &JobQuery) {
    builder.push(" AND status = 'published' AND deleted_at IS NULL");
    builder
        .push(" AND (expires_at IS NULL OR expires_at > ")
        .push_bind(encode_dt(query.now))
        .push(")");
    if query.featured_only {
        builder
            .push(" AND featured_until IS NOT NULL AND featured_until > ")
            .push_bind(encode_dt(query.now));
    }
    if let Some(category) = query.category {
        builder
            .push(" AND category = ")
            .push_bind(category.as_str());
    }
    if let Some(qark) = query.qark {
        builder.push(" AND qark = ").push_bind(qark.as_str());
    }
    if let Some(employment_type) = query.employment_type {
        builder
            .push(" AND employment_type = ")
            .push_bind(employment_type.as_str());
    }
    if let Some(remote) = query.remote {
        builder
            .push(" AND remote = ")
            .push_bind(if remote { 1_i64 } else { 0_i64 });
    }
    if let Some(city) = &query.city {
        builder
            .push(" AND city LIKE ")
            .push_bind(format!("%{}%", city));
    }
    if let Some(search) = &query.search {
        let pattern = format!("%{}%", search);
        builder
            .push(" AND (title LIKE ")
            .push_bind(pattern.clone())
            .push(" OR description LIKE ")
            .push_bind(pattern)
            .push(")");
    }
}

#[async_trait]
impl JobRepository for SqliteJobRepository {
    async fn create(&self, job: &Job) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO jobs (id, business_id, title, description, category, employment_type, \
             qark, city, remote, salary_min, salary_max, salary_period, status, featured_until, \
             published_at, expires_at, deleted_at, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(encode_uuid(job.id))
        .bind(encode_uuid(job.business_id))
        .bind(&job.title)
        .bind(&job.description)
        .bind(job.category.as_str())
        .bind(job.employment_type.as_str())
        .bind(job.qark.as_str())
        .bind(&job.city)
        .bind(job.remote)
        .bind(job.salary_min)
        .bind(job.salary_max)
        .bind(job.salary_period.map(|period| period.as_str()))
        .bind(job.status.as_str())
        .bind(encode_opt_dt(job.featured_until))
        .bind(encode_opt_dt(job.published_at))
        .bind(encode_opt_dt(job.expires_at))
        .bind(encode_opt_dt(job.deleted_at))
        .bind(encode_dt(job.created_at))
        .bind(encode_dt(job.updated_at))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Job>> {
        let row = sqlx::query_as::<_, JobRow>(&format!(
            "SELECT {COLUMNS} FROM jobs WHERE id = ? AND deleted_at IS NULL"
        ))
        .bind(encode_uuid(id))
        .fetch_optional(&self.pool)
        .await?;
        row.map(Job::try_from).transpose()
    }

    async fn update(&self, job: &Job) -> AppResult<()> {
        sqlx::query(
            "UPDATE jobs SET title = ?, description = ?, category = ?, employment_type = ?, \
             qark = ?, city = ?, remote = ?, salary_min = ?, salary_max = ?, salary_period = ?, \
             status = ?, featured_until = ?, published_at = ?, expires_at = ?, deleted_at = ?, \
             updated_at = ? WHERE id = ?",
        )
        .bind(&job.title)
        .bind(&job.description)
        .bind(job.category.as_str())
        .bind(job.employment_type.as_str())
        .bind(job.qark.as_str())
        .bind(&job.city)
        .bind(job.remote)
        .bind(job.salary_min)
        .bind(job.salary_max)
        .bind(job.salary_period.map(|period| period.as_str()))
        .bind(job.status.as_str())
        .bind(encode_opt_dt(job.featured_until))
        .bind(encode_opt_dt(job.published_at))
        .bind(encode_opt_dt(job.expires_at))
        .bind(encode_opt_dt(job.deleted_at))
        .bind(encode_dt(job.updated_at))
        .bind(encode_uuid(job.id))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list_public(&self, query: &JobQuery, page: Pagination) -> AppResult<(Vec<Job>, i64)> {
        let mut count_builder =
            QueryBuilder::<Sqlite>::new("SELECT COUNT(*) FROM jobs WHERE 1 = 1");
        push_public_filters(&mut count_builder, query);
        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(&self.pool)
            .await?;

        let mut builder =
            QueryBuilder::<Sqlite>::new(format!("SELECT {COLUMNS} FROM jobs WHERE 1 = 1"));
        push_public_filters(&mut builder, query);
        builder
            .push(" ORDER BY (CASE WHEN featured_until IS NOT NULL AND featured_until > ")
            .push_bind(encode_dt(query.now))
            .push(" THEN 1 ELSE 0 END) DESC, ");
        match query.sort {
            JobSort::Newest => builder.push("published_at DESC, created_at DESC"),
            JobSort::Oldest => builder.push("published_at ASC, created_at ASC"),
            JobSort::SalaryHigh => builder.push("salary_max DESC, published_at DESC"),
            JobSort::SalaryLow => builder.push("salary_min ASC, published_at DESC"),
        };
        builder
            .push(" LIMIT ")
            .push_bind(page.limit)
            .push(" OFFSET ")
            .push_bind(page.offset);

        let rows = builder
            .build_query_as::<JobRow>()
            .fetch_all(&self.pool)
            .await?;
        let jobs = rows
            .into_iter()
            .map(Job::try_from)
            .collect::<AppResult<Vec<_>>>()?;
        Ok((jobs, total))
    }

    async fn list_by_business(
        &self,
        business_id: Uuid,
        page: Pagination,
    ) -> AppResult<(Vec<Job>, i64)> {
        let total: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM jobs WHERE business_id = ? AND deleted_at IS NULL",
        )
        .bind(encode_uuid(business_id))
        .fetch_one(&self.pool)
        .await?;

        let rows = sqlx::query_as::<_, JobRow>(&format!(
            "SELECT {COLUMNS} FROM jobs WHERE business_id = ? AND deleted_at IS NULL \
             ORDER BY created_at DESC LIMIT ? OFFSET ?"
        ))
        .bind(encode_uuid(business_id))
        .bind(page.limit)
        .bind(page.offset)
        .fetch_all(&self.pool)
        .await?;
        let jobs = rows
            .into_iter()
            .map(Job::try_from)
            .collect::<AppResult<Vec<_>>>()?;
        Ok((jobs, total))
    }

    async fn list_admin(
        &self,
        query: &AdminJobQuery,
        page: Pagination,
    ) -> AppResult<(Vec<Job>, i64)> {
        let mut count_builder =
            QueryBuilder::<Sqlite>::new("SELECT COUNT(*) FROM jobs WHERE 1 = 1");
        if let Some(status) = query.status {
            count_builder
                .push(" AND status = ")
                .push_bind(status.as_str());
        }
        if let Some(business_id) = query.business_id {
            count_builder
                .push(" AND business_id = ")
                .push_bind(encode_uuid(business_id));
        }
        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(&self.pool)
            .await?;

        let mut builder =
            QueryBuilder::<Sqlite>::new(format!("SELECT {COLUMNS} FROM jobs WHERE 1 = 1"));
        if let Some(status) = query.status {
            builder.push(" AND status = ").push_bind(status.as_str());
        }
        if let Some(business_id) = query.business_id {
            builder
                .push(" AND business_id = ")
                .push_bind(encode_uuid(business_id));
        }
        builder
            .push(" ORDER BY created_at DESC LIMIT ")
            .push_bind(page.limit)
            .push(" OFFSET ")
            .push_bind(page.offset);

        let rows = builder
            .build_query_as::<JobRow>()
            .fetch_all(&self.pool)
            .await?;
        let jobs = rows
            .into_iter()
            .map(Job::try_from)
            .collect::<AppResult<Vec<_>>>()?;
        Ok((jobs, total))
    }

    async fn expire_due(&self, now: DateTime<Utc>) -> AppResult<u64> {
        let result = sqlx::query(
            "UPDATE jobs SET status = 'expired', updated_at = ? \
             WHERE status = 'published' AND expires_at IS NOT NULL AND expires_at <= ?",
        )
        .bind(encode_dt(now))
        .bind(encode_dt(now))
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected())
    }
}
