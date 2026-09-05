use std::sync::Arc;

use chrono::{Duration, Utc};
use uuid::Uuid;

use crate::domain::refresh_token::RefreshToken;
use crate::domain::role::Role;
use crate::domain::token::{TokenPurpose, VerificationToken};
use crate::domain::user::{User, UserStatus};
use crate::dto::auth::{
    ForgotPasswordRequest, LoginRequest, RegisterRequest, ResendVerificationRequest,
    ResetPasswordRequest,
};
use crate::error::{AppError, AppResult};
use crate::repository::{RefreshTokenRepository, TokenRepository, UserRepository};
use crate::security::jwt::JwtService;
use crate::security::password::{hash_password, verify_password};
use crate::security::random::{generate_opaque_token, hash_token};
use crate::service::email::EmailService;

pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
}

pub struct AuthService {
    users: Arc<dyn UserRepository>,
    refresh_tokens: Arc<dyn RefreshTokenRepository>,
    tokens: Arc<dyn TokenRepository>,
    jwt: Arc<JwtService>,
    email: Arc<EmailService>,
    access_ttl_secs: i64,
    refresh_ttl: Duration,
    email_verification_ttl: Duration,
    password_reset_ttl: Duration,
}

impl AuthService {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        users: Arc<dyn UserRepository>,
        refresh_tokens: Arc<dyn RefreshTokenRepository>,
        tokens: Arc<dyn TokenRepository>,
        jwt: Arc<JwtService>,
        email: Arc<EmailService>,
        access_ttl_secs: i64,
        refresh_ttl: Duration,
        email_verification_ttl: Duration,
        password_reset_ttl: Duration,
    ) -> Self {
        Self {
            users,
            refresh_tokens,
            tokens,
            jwt,
            email,
            access_ttl_secs,
            refresh_ttl,
            email_verification_ttl,
            password_reset_ttl,
        }
    }

    pub async fn register(&self, request: RegisterRequest) -> AppResult<(User, TokenPair)> {
        let email = normalize_email(&request.email);
        if self.users.find_by_email(&email).await?.is_some() {
            return Err(AppError::conflict(
                "an account with this email already exists",
            ));
        }

        let now = Utc::now();
        let user = User {
            id: Uuid::now_v7(),
            email,
            password_hash: hash_password(&request.password)?,
            full_name: request.full_name.trim().to_string(),
            phone: request.phone.map(|phone| phone.trim().to_string()),
            role: Role::User,
            email_verified_at: None,
            status: UserStatus::Active,
            created_at: now,
            updated_at: now,
        };
        self.users.create(&user).await?;

        self.issue_email_verification(&user).await?;
        let tokens = self.issue_tokens(&user).await?;
        Ok((user, tokens))
    }

    pub async fn login(&self, request: LoginRequest) -> AppResult<(User, TokenPair)> {
        let email = normalize_email(&request.email);
        let user = self
            .users
            .find_by_email(&email)
            .await?
            .ok_or(AppError::InvalidCredentials)?;

        if !verify_password(&request.password, &user.password_hash)? {
            return Err(AppError::InvalidCredentials);
        }
        if !user.is_active() {
            return Err(AppError::Forbidden);
        }

        let tokens = self.issue_tokens(&user).await?;
        Ok((user, tokens))
    }

    pub async fn refresh(&self, raw_refresh_token: &str) -> AppResult<TokenPair> {
        let now = Utc::now();
        let stored = self
            .refresh_tokens
            .find_active_by_hash(&hash_token(raw_refresh_token), now)
            .await?
            .ok_or(AppError::Unauthorized)?;

        let user = self
            .users
            .find_by_id(stored.user_id)
            .await?
            .ok_or(AppError::Unauthorized)?;
        if !user.is_active() {
            return Err(AppError::Forbidden);
        }

        self.refresh_tokens.revoke(stored.id, now).await?;
        self.issue_tokens(&user).await
    }

    pub async fn logout(&self, raw_refresh_token: &str) -> AppResult<()> {
        let now = Utc::now();
        if let Some(stored) = self
            .refresh_tokens
            .find_active_by_hash(&hash_token(raw_refresh_token), now)
            .await?
        {
            self.refresh_tokens.revoke(stored.id, now).await?;
        }
        Ok(())
    }

    pub async fn verify_email(&self, raw_token: &str) -> AppResult<()> {
        let now = Utc::now();
        let token = self
            .tokens
            .find_active_by_hash(&hash_token(raw_token), TokenPurpose::EmailVerification, now)
            .await?
            .ok_or_else(|| {
                AppError::bad_request("the verification link is invalid or has expired")
            })?;

        let mut user = self.users.find_by_id(token.user_id).await?.ok_or_else(|| {
            AppError::bad_request("the verification link is invalid or has expired")
        })?;

        self.tokens.mark_used(token.id, now).await?;
        if user.email_verified_at.is_none() {
            user.email_verified_at = Some(now);
            user.updated_at = now;
            self.users.update(&user).await?;
        }
        Ok(())
    }

    pub async fn resend_verification(&self, request: ResendVerificationRequest) -> AppResult<()> {
        let email = normalize_email(&request.email);
        if let Some(user) = self.users.find_by_email(&email).await? {
            if user.email_verified_at.is_none() && user.is_active() {
                self.tokens
                    .invalidate_for_user(user.id, TokenPurpose::EmailVerification, Utc::now())
                    .await?;
                self.issue_email_verification(&user).await?;
            }
        }
        Ok(())
    }

    pub async fn forgot_password(&self, request: ForgotPasswordRequest) -> AppResult<()> {
        let email = normalize_email(&request.email);
        if let Some(user) = self.users.find_by_email(&email).await? {
            if user.is_active() {
                self.tokens
                    .invalidate_for_user(user.id, TokenPurpose::PasswordReset, Utc::now())
                    .await?;
                let raw_token = generate_opaque_token();
                self.store_token(
                    &user,
                    &raw_token,
                    TokenPurpose::PasswordReset,
                    self.password_reset_ttl,
                )
                .await?;
                self.email
                    .send_password_reset(&user.email, &user.full_name, &raw_token)
                    .await?;
            }
        }
        Ok(())
    }

    pub async fn reset_password(&self, request: ResetPasswordRequest) -> AppResult<()> {
        let now = Utc::now();
        let token = self
            .tokens
            .find_active_by_hash(
                &hash_token(&request.token),
                TokenPurpose::PasswordReset,
                now,
            )
            .await?
            .ok_or_else(|| AppError::bad_request("the reset link is invalid or has expired"))?;

        let mut user = self
            .users
            .find_by_id(token.user_id)
            .await?
            .ok_or_else(|| AppError::bad_request("the reset link is invalid or has expired"))?;

        self.tokens.mark_used(token.id, now).await?;
        user.password_hash = hash_password(&request.password)?;
        user.updated_at = now;
        self.users.update(&user).await?;
        self.refresh_tokens
            .revoke_all_for_user(user.id, now)
            .await?;
        Ok(())
    }

    async fn issue_email_verification(&self, user: &User) -> AppResult<()> {
        let raw_token = generate_opaque_token();
        self.store_token(
            user,
            &raw_token,
            TokenPurpose::EmailVerification,
            self.email_verification_ttl,
        )
        .await?;
        self.email
            .send_email_verification(&user.email, &user.full_name, &raw_token)
            .await
    }

    async fn store_token(
        &self,
        user: &User,
        raw_token: &str,
        purpose: TokenPurpose,
        ttl: Duration,
    ) -> AppResult<()> {
        let now = Utc::now();
        let token = VerificationToken {
            id: Uuid::now_v7(),
            user_id: user.id,
            token_hash: hash_token(raw_token),
            purpose,
            expires_at: now + ttl,
            used_at: None,
            created_at: now,
        };
        self.tokens.create(&token).await
    }

    async fn issue_tokens(&self, user: &User) -> AppResult<TokenPair> {
        let access_token = self.jwt.issue_access_token(user.id, user.role)?;
        let raw_refresh_token = generate_opaque_token();
        let now = Utc::now();
        let refresh = RefreshToken {
            id: Uuid::now_v7(),
            user_id: user.id,
            token_hash: hash_token(&raw_refresh_token),
            expires_at: now + self.refresh_ttl,
            revoked_at: None,
            created_at: now,
        };
        self.refresh_tokens.create(&refresh).await?;
        Ok(TokenPair {
            access_token,
            refresh_token: raw_refresh_token,
            expires_in: self.access_ttl_secs,
        })
    }
}

fn normalize_email(email: &str) -> String {
    email.trim().to_lowercase()
}
