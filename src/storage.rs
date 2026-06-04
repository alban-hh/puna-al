use std::path::Path;
use std::sync::Arc;

use anyhow::Context;

use crate::config::Config;
use crate::queue::postgres::PostgresQueue;
use crate::queue::sqlite::SqliteQueue;
use crate::queue::Queue;
use crate::repository::postgres::{
    connect_pool as connect_postgres, PgApplicationRepository, PgBusinessRepository,
    PgJobRepository, PgRefreshTokenRepository, PgStatsRepository, PgTokenRepository,
    PgUserRepository,
};
use crate::repository::sqlite::{
    connect_pool as connect_sqlite, SqliteApplicationRepository, SqliteBusinessRepository,
    SqliteJobRepository, SqliteRefreshTokenRepository, SqliteStatsRepository,
    SqliteTokenRepository, SqliteUserRepository,
};
use crate::repository::{
    ApplicationRepository, BusinessRepository, JobRepository, RefreshTokenRepository,
    StatsRepository, TokenRepository, UserRepository,
};

const SQLITE_MAX_CONNECTIONS: u32 = 5;
const POSTGRES_MAX_CONNECTIONS: u32 = 10;

pub struct Storage {
    pub users: Arc<dyn UserRepository>,
    pub businesses: Arc<dyn BusinessRepository>,
    pub jobs: Arc<dyn JobRepository>,
    pub applications: Arc<dyn ApplicationRepository>,
    pub tokens: Arc<dyn TokenRepository>,
    pub refresh_tokens: Arc<dyn RefreshTokenRepository>,
    pub stats: Arc<dyn StatsRepository>,
    pub queue: Arc<dyn Queue>,
}

pub async fn connect(config: &Config) -> anyhow::Result<Storage> {
    if is_postgres(&config.database_url) {
        connect_postgres_storage(config).await
    } else {
        connect_sqlite_storage(config).await
    }
}

async fn connect_postgres_storage(config: &Config) -> anyhow::Result<Storage> {
    let pool = connect_postgres(&config.database_url, POSTGRES_MAX_CONNECTIONS).await?;
    sqlx::migrate!("./migrations/postgres")
        .run(&pool)
        .await
        .context("failed to run postgres migrations")?;
    tracing::info!("connected to postgres database");

    Ok(Storage {
        users: Arc::new(PgUserRepository::new(pool.clone())),
        businesses: Arc::new(PgBusinessRepository::new(pool.clone())),
        jobs: Arc::new(PgJobRepository::new(pool.clone())),
        applications: Arc::new(PgApplicationRepository::new(pool.clone())),
        tokens: Arc::new(PgTokenRepository::new(pool.clone())),
        refresh_tokens: Arc::new(PgRefreshTokenRepository::new(pool.clone())),
        stats: Arc::new(PgStatsRepository::new(pool.clone())),
        queue: Arc::new(PostgresQueue::new(pool, config.queue_max_attempts)),
    })
}

async fn connect_sqlite_storage(config: &Config) -> anyhow::Result<Storage> {
    ensure_sqlite_parent_dir(&config.database_url)?;
    let pool = connect_sqlite(&config.database_url, SQLITE_MAX_CONNECTIONS).await?;
    sqlx::migrate!("./migrations/sqlite")
        .run(&pool)
        .await
        .context("failed to run sqlite migrations")?;
    tracing::info!("connected to sqlite database");

    Ok(Storage {
        users: Arc::new(SqliteUserRepository::new(pool.clone())),
        businesses: Arc::new(SqliteBusinessRepository::new(pool.clone())),
        jobs: Arc::new(SqliteJobRepository::new(pool.clone())),
        applications: Arc::new(SqliteApplicationRepository::new(pool.clone())),
        tokens: Arc::new(SqliteTokenRepository::new(pool.clone())),
        refresh_tokens: Arc::new(SqliteRefreshTokenRepository::new(pool.clone())),
        stats: Arc::new(SqliteStatsRepository::new(pool.clone())),
        queue: Arc::new(SqliteQueue::new(pool, config.queue_max_attempts)),
    })
}

fn is_postgres(database_url: &str) -> bool {
    database_url.starts_with("postgres://") || database_url.starts_with("postgresql://")
}

fn ensure_sqlite_parent_dir(database_url: &str) -> anyhow::Result<()> {
    let without_scheme = database_url
        .strip_prefix("sqlite://")
        .or_else(|| database_url.strip_prefix("sqlite:"))
        .unwrap_or(database_url);
    let path_part = without_scheme.split('?').next().unwrap_or(without_scheme);
    if path_part.is_empty() || path_part == ":memory:" {
        return Ok(());
    }

    if let Some(parent) = Path::new(path_part).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).with_context(|| {
                format!("failed to create database directory {}", parent.display())
            })?;
        }
    }
    Ok(())
}
