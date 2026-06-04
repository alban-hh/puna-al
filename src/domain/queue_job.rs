use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::string_enum;

string_enum!(QueueJobStatus {
    Pending => "pending",
    Processing => "processing",
    Sent => "sent",
    Failed => "failed",
});

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct QueueJob {
    pub id: Uuid,
    pub kind: String,
    pub payload: serde_json::Value,
    pub status: QueueJobStatus,
    pub attempts: i64,
    pub max_attempts: i64,
    pub run_at: DateTime<Utc>,
    pub last_error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
