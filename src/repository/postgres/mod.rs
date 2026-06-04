pub mod application_repo;
pub mod business_repo;
pub mod job_repo;
pub mod refresh_token_repo;
pub mod stats_repo;
pub mod token_repo;
pub mod user_repo;

use std::str::FromStr;
use std::time::Duration;

use anyhow::anyhow;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;

use crate::error::{AppError, AppResult};

pub use application_repo::PgApplicationRepository;
pub use business_repo::PgBusinessRepository;
pub use job_repo::PgJobRepository;
pub use refresh_token_repo::PgRefreshTokenRepository;
pub use stats_repo::PgStatsRepository;
pub use token_repo::PgTokenRepository;
pub use user_repo::PgUserRepository;

pub async fn connect_pool(database_url: &str, max_connections: u32) -> AppResult<PgPool> {
    let sanitized = strip_unsupported_params(database_url);
    let options = PgConnectOptions::from_str(&sanitized)
        .map_err(|e| AppError::Internal(anyhow!("invalid DATABASE_URL: {e}")))?;

    PgPoolOptions::new()
        .max_connections(max_connections)
        .acquire_timeout(Duration::from_secs(15))
        .connect_with(options)
        .await
        .map_err(|e| AppError::Internal(anyhow!("failed to connect to the database: {e}")))
}

fn strip_unsupported_params(database_url: &str) -> String {
    match database_url.split_once('?') {
        Some((base, query)) => {
            let kept: Vec<&str> = query
                .split('&')
                .filter(|pair| !pair.starts_with("channel_binding"))
                .collect();
            if kept.is_empty() {
                base.to_string()
            } else {
                format!("{base}?{}", kept.join("&"))
            }
        }
        None => database_url.to_string(),
    }
}
