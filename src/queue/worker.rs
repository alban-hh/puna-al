use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use chrono::Utc;
use tokio::sync::watch;

use crate::domain::queue_job::QueueJob;
use crate::email::{EmailClient, EmailMessage};
use crate::error::{AppError, AppResult};
use crate::queue::{Queue, EMAIL_JOB_KIND};
use crate::repository::JobRepository;

const BACKOFF_BASE_SECONDS: i64 = 30;
const BACKOFF_MAX_SECONDS: i64 = 3600;

pub async fn run(
    queue: Arc<dyn Queue>,
    email: Arc<dyn EmailClient>,
    jobs: Arc<dyn JobRepository>,
    poll_interval: Duration,
    batch_size: i64,
    mut shutdown: watch::Receiver<bool>,
) {
    tracing::info!("background worker started");
    loop {
        process_tick(&queue, &email, &jobs, batch_size).await;
        tokio::select! {
            _ = tokio::time::sleep(poll_interval) => {}
            changed = shutdown.changed() => {
                if changed.is_err() || *shutdown.borrow() {
                    break;
                }
            }
        }
    }
    tracing::info!("background worker stopped");
}

async fn process_tick(
    queue: &Arc<dyn Queue>,
    email: &Arc<dyn EmailClient>,
    jobs: &Arc<dyn JobRepository>,
    batch_size: i64,
) {
    let now = Utc::now();

    match jobs.expire_due(now).await {
        Ok(count) if count > 0 => tracing::info!(expired = count, "marked due jobs as expired"),
        Ok(_) => {}
        Err(error) => tracing::error!(?error, "failed to expire due jobs"),
    }

    let due = match queue.claim_due(now, batch_size).await {
        Ok(due) => due,
        Err(error) => {
            tracing::error!(?error, "failed to claim due queue jobs");
            return;
        }
    };

    for job in due {
        handle_job(queue, email, job).await;
    }
}

async fn handle_job(queue: &Arc<dyn Queue>, email: &Arc<dyn EmailClient>, job: QueueJob) {
    match dispatch(email, &job).await {
        Ok(()) => {
            if let Err(error) = queue.mark_sent(job.id, Utc::now()).await {
                tracing::error!(job_id = %job.id, ?error, "failed to mark queue job as sent");
            }
        }
        Err(error) => {
            let message = error.to_string();
            if job.attempts >= job.max_attempts {
                tracing::error!(
                    job_id = %job.id,
                    attempts = job.attempts,
                    error = %message,
                    "queue job failed permanently"
                );
                if let Err(error) = queue.mark_failed(job.id, &message).await {
                    tracing::error!(job_id = %job.id, ?error, "failed to mark queue job as failed");
                }
            } else {
                let next_run_at = Utc::now() + backoff(job.attempts);
                tracing::warn!(
                    job_id = %job.id,
                    attempts = job.attempts,
                    error = %message,
                    "queue job failed, scheduling retry"
                );
                if let Err(error) = queue.reschedule(job.id, next_run_at, &message).await {
                    tracing::error!(job_id = %job.id, ?error, "failed to reschedule queue job");
                }
            }
        }
    }
}

async fn dispatch(email: &Arc<dyn EmailClient>, job: &QueueJob) -> AppResult<()> {
    match job.kind.as_str() {
        EMAIL_JOB_KIND => {
            let message: EmailMessage = serde_json::from_value(job.payload.clone())
                .map_err(|e| AppError::Internal(anyhow!("invalid email job payload: {e}")))?;
            email.send(&message).await
        }
        other => Err(AppError::Internal(anyhow!(
            "unknown queue job kind: {other}"
        ))),
    }
}

fn backoff(attempts: i64) -> chrono::Duration {
    let exponent = attempts.clamp(1, 16) as u32;
    let factor = 2_i64.saturating_pow(exponent - 1);
    let seconds = BACKOFF_BASE_SECONDS
        .saturating_mul(factor)
        .min(BACKOFF_MAX_SECONDS);
    chrono::Duration::seconds(seconds)
}
