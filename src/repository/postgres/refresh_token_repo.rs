use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::refresh_token::RefreshToken;
use crate::error::{AppError, AppResult};
use crate::repository::convert::{encode_dt, encode_opt_dt, encode_uuid, parse_dt, parse_opt_dt, parse_uuid};
use crate::repository::RefreshTokenRepository;

pub struct PgRefreshTokenRepository {
    pool: PgPool,
}

impl PgRefreshTokenRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct RefreshTokenRow {
    id: String,
    user_id: String,
    token_hash: String,
    expires_at: String,
    revoked_at: Option<String>,
    created_at: String,
}

impl TryFrom<RefreshTokenRow> for RefreshToken {
    type Error = AppError;

    fn try_from(row: RefreshTokenRow) -> AppResult<Self> {
        Ok(RefreshToken {
            id: parse_uuid(&row.id)?,
            user_id: parse_uuid(&row.user_id)?,
            token_hash: row.token_hash,
            expires_at: parse_dt(&row.expires_at)?,
            revoked_at: parse_opt_dt(row.revoked_at)?,
            created_at: parse_dt(&row.created_at)?,
        })
    }
}

#[async_trait]
impl RefreshTokenRepository for PgRefreshTokenRepository {
    async fn create(&self, token: &RefreshToken) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at, \
             created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(encode_uuid(token.id))
        .bind(encode_uuid(token.user_id))
        .bind(&token.token_hash)
        .bind(encode_dt(token.expires_at))
        .bind(encode_opt_dt(token.revoked_at))
        .bind(encode_dt(token.created_at))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn find_active_by_hash(
        &self,
        token_hash: &str,
        now: DateTime<Utc>,
    ) -> AppResult<Option<RefreshToken>> {
        let row = sqlx::query_as::<_, RefreshTokenRow>(
            "SELECT id, user_id, token_hash, expires_at, revoked_at, created_at \
             FROM refresh_tokens \
             WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > $2",
        )
        .bind(token_hash)
        .bind(encode_dt(now))
        .fetch_optional(&self.pool)
        .await?;
        row.map(RefreshToken::try_from).transpose()
    }

    async fn revoke(&self, id: Uuid, revoked_at: DateTime<Utc>) -> AppResult<()> {
        sqlx::query("UPDATE refresh_tokens SET revoked_at = $1 WHERE id = $2 AND revoked_at IS NULL")
            .bind(encode_dt(revoked_at))
            .bind(encode_uuid(id))
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn revoke_all_for_user(
        &self,
        user_id: Uuid,
        revoked_at: DateTime<Utc>,
    ) -> AppResult<()> {
        sqlx::query(
            "UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2 AND revoked_at IS NULL",
        )
        .bind(encode_dt(revoked_at))
        .bind(encode_uuid(user_id))
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
