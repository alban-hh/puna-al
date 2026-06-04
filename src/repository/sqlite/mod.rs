pub mod application_repo;
pub mod business_repo;
pub mod convert;
pub mod job_repo;
pub mod refresh_token_repo;
pub mod stats_repo;
pub mod token_repo;
pub mod user_repo;

use std::str::FromStr;
use std::time::Duration;

use anyhow::anyhow;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::SqlitePool;

use crate::error::{AppError, AppResult};

pub use application_repo::SqliteApplicationRepository;
pub use business_repo::SqliteBusinessRepository;
pub use job_repo::SqliteJobRepository;
pub use refresh_token_repo::SqliteRefreshTokenRepository;
pub use stats_repo::SqliteStatsRepository;
pub use token_repo::SqliteTokenRepository;
pub use user_repo::SqliteUserRepository;

pub async fn connect_pool(database_url: &str, max_connections: u32) -> AppResult<SqlitePool> {
    let options = SqliteConnectOptions::from_str(database_url)
        .map_err(|e| AppError::Internal(anyhow!("invalid DATABASE_URL: {e}")))?
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5));

    SqlitePoolOptions::new()
        .max_connections(max_connections)
        .connect_with(options)
        .await
        .map_err(|e| AppError::Internal(anyhow!("failed to connect to the database: {e}")))
}
