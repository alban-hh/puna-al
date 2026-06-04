use async_trait::async_trait;
use sqlx::PgPool;

use crate::error::AppResult;
use crate::repository::params::PlatformStats;
use crate::repository::StatsRepository;

pub struct PgStatsRepository {
    pool: PgPool,
}

impl PgStatsRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn count(&self, sql: &str) -> AppResult<i64> {
        let value: i64 = sqlx::query_scalar(sql).fetch_one(&self.pool).await?;
        Ok(value)
    }
}

#[async_trait]
impl StatsRepository for PgStatsRepository {
    async fn platform_stats(&self) -> AppResult<PlatformStats> {
        Ok(PlatformStats {
            total_users: self.count("SELECT COUNT(*) FROM users").await?,
            suspended_users: self
                .count("SELECT COUNT(*) FROM users WHERE status = 'suspended'")
                .await?,
            total_businesses: self.count("SELECT COUNT(*) FROM businesses").await?,
            pending_businesses: self
                .count("SELECT COUNT(*) FROM businesses WHERE status = 'pending'")
                .await?,
            approved_businesses: self
                .count("SELECT COUNT(*) FROM businesses WHERE status = 'approved'")
                .await?,
            total_jobs: self
                .count("SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL")
                .await?,
            published_jobs: self
                .count("SELECT COUNT(*) FROM jobs WHERE status = 'published' AND deleted_at IS NULL")
                .await?,
            total_applications: self.count("SELECT COUNT(*) FROM applications").await?,
        })
    }
}
