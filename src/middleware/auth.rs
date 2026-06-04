use std::sync::Arc;

use axum::extract::{FromRef, FromRequestParts};
use axum::http::header::AUTHORIZATION;
use axum::http::request::Parts;

use crate::domain::user::User;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub struct AuthUser(pub User);
pub struct VerifiedUser(pub User);
pub struct AdminUser(pub User);
pub struct OptionalUser(pub Option<User>);

impl<S> FromRequestParts<S> for AuthUser
where
    Arc<AppState>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        Ok(AuthUser(authenticate(parts, state).await?))
    }
}

impl<S> FromRequestParts<S> for VerifiedUser
where
    Arc<AppState>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = authenticate(parts, state).await?;
        if !user.is_verified() {
            return Err(AppError::Forbidden);
        }
        Ok(VerifiedUser(user))
    }
}

impl<S> FromRequestParts<S> for AdminUser
where
    Arc<AppState>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = authenticate(parts, state).await?;
        if !user.role.is_admin() {
            return Err(AppError::Forbidden);
        }
        Ok(AdminUser(user))
    }
}

impl<S> FromRequestParts<S> for OptionalUser
where
    Arc<AppState>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        if bearer_token(parts).is_none() {
            return Ok(OptionalUser(None));
        }
        Ok(OptionalUser(Some(authenticate(parts, state).await?)))
    }
}

fn bearer_token(parts: &Parts) -> Option<String> {
    parts
        .headers
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .map(|token| token.trim().to_string())
        .filter(|token| !token.is_empty())
}

async fn authenticate<S>(parts: &Parts, state: &S) -> AppResult<User>
where
    Arc<AppState>: FromRef<S>,
    S: Send + Sync,
{
    let app = Arc::<AppState>::from_ref(state);
    let token = bearer_token(parts).ok_or(AppError::Unauthorized)?;
    let claims = app.jwt.decode_access_token(&token)?;
    let user = app
        .users
        .find_by_id(claims.user_id()?)
        .await?
        .ok_or(AppError::Unauthorized)?;
    if !user.is_active() {
        return Err(AppError::Forbidden);
    }
    Ok(user)
}
