use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::queue_job::QueueJob;
use crate::error::{AppError, AppResult};
use crate::queue::Queue;
use crate::repository::convert::{encode_dt, encode_uuid, parse_dt, parse_enum, parse_uuid};

pub struct PostgresQueue {
    pool: PgPool,
    default_max_attempts: i64,
}

impl PostgresQueue {
    pub fn new(pool: PgPool, default_max_attempts: i64) -> Self {
        Self {
            pool,
            default_max_attempts,
        }
    }
}

#[derive(sqlx::FromRow)]
struct QueueJobRow {
    id: String,
    kind: String,
    payload: String,
    status: String,
    attempts: i64,
    max_attempts: i64,
    run_at: String,
    last_error: Option<String>,
    created_at: String,
    updated_at: String,
}

impl TryFrom<QueueJobRow> for QueueJob {
    type Error = AppError;

    fn try_from(row: QueueJobRow) -> AppResult<Self> {
        let payload: Value = serde_json::from_str(&row.payload).map_err(|e| {
            AppError::Internal(anyhow::anyhow!("corrupt queue payload in database: {e}"))
        })?;
        Ok(QueueJob {
            id: parse_uuid(&row.id)?,
            kind: row.kind,
            payload,
            status: parse_enum(&row.status)?,
            attempts: row.attempts,
            max_attempts: row.max_attempts,
            run_at: parse_dt(&row.run_at)?,
            last_error: row.last_error,
            created_at: parse_dt(&row.created_at)?,
            updated_at: parse_dt(&row.updated_at)?,
        })
    }
}

const COLUMNS: &str = "id, kind, payload, status, attempts, max_attempts, run_at, last_error, \
    created_at, updated_at";

#[async_trait]
impl Queue for PostgresQueue {
    async fn enqueue(&self, kind: &str, payload: Value, run_at: DateTime<Utc>) -> AppResult<()> {
        let encoded = serde_json::to_string(&payload).map_err(|e| {
            AppError::Internal(anyhow::anyhow!("failed to serialize queue payload: {e}"))
        })?;
        let now = Utc::now();
        sqlx::query(
            "INSERT INTO queue_jobs (id, kind, payload, status, attempts, max_attempts, run_at, \
             last_error, created_at, updated_at) \
             VALUES ($1, $2, $3, 'pending', 0, $4, $5, NULL, $6, $7)",
        )
        .bind(encode_uuid(Uuid::now_v7()))
        .bind(kind)
        .bind(encoded)
        .bind(self.default_max_attempts)
        .bind(encode_dt(run_at))
        .bind(encode_dt(now))
        .bind(encode_dt(now))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn claim_due(&self, now: DateTime<Utc>, limit: i64) -> AppResult<Vec<QueueJob>> {
        let rows = sqlx::query_as::<_, QueueJobRow>(&format!(
            "UPDATE queue_jobs SET status = 'processing', attempts = attempts + 1, \
             updated_at = $1 \
             WHERE id IN ( \
                 SELECT id FROM queue_jobs WHERE status = 'pending' AND run_at <= $2 \
                 ORDER BY run_at LIMIT $3 FOR UPDATE SKIP LOCKED \
             ) RETURNING {COLUMNS}"
        ))
        .bind(encode_dt(now))
        .bind(encode_dt(now))
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        rows.into_iter().map(QueueJob::try_from).collect()
    }

    async fn mark_sent(&self, id: Uuid, completed_at: DateTime<Utc>) -> AppResult<()> {
        sqlx::query("UPDATE queue_jobs SET status = 'sent', updated_at = $1 WHERE id = $2")
            .bind(encode_dt(completed_at))
            .bind(encode_uuid(id))
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn reschedule(
        &self,
        id: Uuid,
        run_at: DateTime<Utc>,
        last_error: &str,
    ) -> AppResult<()> {
        sqlx::query(
            "UPDATE queue_jobs SET status = 'pending', run_at = $1, last_error = $2, \
             updated_at = $3 WHERE id = $4",
        )
        .bind(encode_dt(run_at))
        .bind(last_error)
        .bind(encode_dt(Utc::now()))
        .bind(encode_uuid(id))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn mark_failed(&self, id: Uuid, last_error: &str) -> AppResult<()> {
        sqlx::query(
            "UPDATE queue_jobs SET status = 'failed', last_error = $1, updated_at = $2 \
             WHERE id = $3",
        )
        .bind(last_error)
        .bind(encode_dt(Utc::now()))
        .bind(encode_uuid(id))
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
