use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::token::{TokenPurpose, VerificationToken};
use crate::error::{AppError, AppResult};
use crate::repository::convert::{
    encode_dt, encode_opt_dt, encode_uuid, parse_dt, parse_enum, parse_opt_dt, parse_uuid,
};
use crate::repository::TokenRepository;

pub struct PgTokenRepository {
    pool: PgPool,
}

impl PgTokenRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct TokenRow {
    id: String,
    user_id: String,
    token_hash: String,
    purpose: String,
    expires_at: String,
    used_at: Option<String>,
    created_at: String,
}

impl TryFrom<TokenRow> for VerificationToken {
    type Error = AppError;

    fn try_from(row: TokenRow) -> AppResult<Self> {
        Ok(VerificationToken {
            id: parse_uuid(&row.id)?,
            user_id: parse_uuid(&row.user_id)?,
            token_hash: row.token_hash,
            purpose: parse_enum(&row.purpose)?,
            expires_at: parse_dt(&row.expires_at)?,
            used_at: parse_opt_dt(row.used_at)?,
            created_at: parse_dt(&row.created_at)?,
        })
    }
}

#[async_trait]
impl TokenRepository for PgTokenRepository {
    async fn create(&self, token: &VerificationToken) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO verification_tokens (id, user_id, token_hash, purpose, expires_at, \
             used_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        )
        .bind(encode_uuid(token.id))
        .bind(encode_uuid(token.user_id))
        .bind(&token.token_hash)
        .bind(token.purpose.as_str())
        .bind(encode_dt(token.expires_at))
        .bind(encode_opt_dt(token.used_at))
        .bind(encode_dt(token.created_at))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn find_active_by_hash(
        &self,
        token_hash: &str,
        purpose: TokenPurpose,
        now: DateTime<Utc>,
    ) -> AppResult<Option<VerificationToken>> {
        let row = sqlx::query_as::<_, TokenRow>(
            "SELECT id, user_id, token_hash, purpose, expires_at, used_at, created_at \
             FROM verification_tokens \
             WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > $3",
        )
        .bind(token_hash)
        .bind(purpose.as_str())
        .bind(encode_dt(now))
        .fetch_optional(&self.pool)
        .await?;
        row.map(VerificationToken::try_from).transpose()
    }

    async fn mark_used(&self, id: Uuid, used_at: DateTime<Utc>) -> AppResult<()> {
        sqlx::query("UPDATE verification_tokens SET used_at = $1 WHERE id = $2")
            .bind(encode_dt(used_at))
            .bind(encode_uuid(id))
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn invalidate_for_user(
        &self,
        user_id: Uuid,
        purpose: TokenPurpose,
        used_at: DateTime<Utc>,
    ) -> AppResult<()> {
        sqlx::query(
            "UPDATE verification_tokens SET used_at = $1 \
             WHERE user_id = $2 AND purpose = $3 AND used_at IS NULL",
        )
        .bind(encode_dt(used_at))
        .bind(encode_uuid(user_id))
        .bind(purpose.as_str())
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
