use anyhow::anyhow;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::role::Role;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: Role,
    pub jti: String,
    pub iat: i64,
    pub exp: i64,
}

impl Claims {
    pub fn user_id(&self) -> AppResult<Uuid> {
        Uuid::parse_str(&self.sub).map_err(|_| AppError::Unauthorized)
    }
}

pub struct JwtService {
    encoding: EncodingKey,
    decoding: DecodingKey,
    access_ttl: Duration,
}

impl JwtService {
    pub fn new(secret: &str, access_ttl: Duration) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret.as_bytes()),
            decoding: DecodingKey::from_secret(secret.as_bytes()),
            access_ttl,
        }
    }

    pub fn issue_access_token(&self, user_id: Uuid, role: Role) -> AppResult<String> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            role,
            jti: Uuid::now_v7().to_string(),
            iat: now.timestamp(),
            exp: (now + self.access_ttl).timestamp(),
        };
        encode(&Header::new(Algorithm::HS256), &claims, &self.encoding)
            .map_err(|e| AppError::Internal(anyhow!("failed to encode access token: {e}")))
    }

    pub fn decode_access_token(&self, token: &str) -> AppResult<Claims> {
        let mut validation = Validation::new(Algorithm::HS256);
        validation.leeway = 5;
        decode::<Claims>(token, &self.decoding, &validation)
            .map(|data| data.claims)
            .map_err(|_| AppError::Unauthorized)
    }
}
