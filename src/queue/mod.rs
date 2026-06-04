pub mod sqlite;
pub mod worker;

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde_json::Value;
use uuid::Uuid;

use crate::domain::queue_job::QueueJob;
use crate::error::AppResult;

pub const EMAIL_JOB_KIND: &str = "email";

#[async_trait]
pub trait Queue: Send + Sync {
    async fn enqueue(&self, kind: &str, payload: Value, run_at: DateTime<Utc>) -> AppResult<()>;
    async fn claim_due(&self, now: DateTime<Utc>, limit: i64) -> AppResult<Vec<QueueJob>>;
    async fn mark_sent(&self, id: Uuid, completed_at: DateTime<Utc>) -> AppResult<()>;
    async fn reschedule(&self, id: Uuid, run_at: DateTime<Utc>, last_error: &str) -> AppResult<()>;
    async fn mark_failed(&self, id: Uuid, last_error: &str) -> AppResult<()>;
}
