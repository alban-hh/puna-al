use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::domain::user::User;
use crate::dto::account::UserResponse;
use crate::dto::auth::{
    AuthResponse, ForgotPasswordRequest, LoginRequest, LogoutRequest, RefreshRequest,
    RegisterRequest, ResendVerificationRequest, ResetPasswordRequest, TokenResponse,
    VerifyEmailRequest,
};
use crate::error::AppResult;
use crate::extract::ValidatedJson;
use crate::service::auth::TokenPair;
use crate::state::AppState;

pub async fn register(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<RegisterRequest>,
) -> AppResult<(StatusCode, Json<AuthResponse>)> {
    let (user, tokens) = state.auth.register(request).await?;
    Ok((StatusCode::CREATED, Json(auth_response(&user, tokens))))
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<LoginRequest>,
) -> AppResult<Json<AuthResponse>> {
    let (user, tokens) = state.auth.login(request).await?;
    Ok(Json(auth_response(&user, tokens)))
}

pub async fn refresh(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<RefreshRequest>,
) -> AppResult<Json<TokenResponse>> {
    let tokens = state.auth.refresh(&request.refresh_token).await?;
    Ok(Json(token_response(tokens)))
}

pub async fn logout(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<LogoutRequest>,
) -> AppResult<StatusCode> {
    state.auth.logout(&request.refresh_token).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn verify_email(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<VerifyEmailRequest>,
) -> AppResult<Json<Value>> {
    state.auth.verify_email(&request.token).await?;
    Ok(Json(json!({ "message": "Email-i u verifikua me sukses." })))
}

pub async fn resend_verification(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<ResendVerificationRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    state.auth.resend_verification(request).await?;
    Ok((StatusCode::ACCEPTED, confirmation()))
}

pub async fn forgot_password(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<ForgotPasswordRequest>,
) -> AppResult<(StatusCode, Json<Value>)> {
    state.auth.forgot_password(request).await?;
    Ok((StatusCode::ACCEPTED, confirmation()))
}

pub async fn reset_password(
    State(state): State<Arc<AppState>>,
    ValidatedJson(request): ValidatedJson<ResetPasswordRequest>,
) -> AppResult<Json<Value>> {
    state.auth.reset_password(request).await?;
    Ok(Json(
        json!({ "message": "Fjalëkalimi u rivendos me sukses." }),
    ))
}

fn auth_response(user: &User, tokens: TokenPair) -> AuthResponse {
    AuthResponse {
        user: UserResponse::from(user),
        tokens: token_response(tokens),
    }
}

fn token_response(pair: TokenPair) -> TokenResponse {
    TokenResponse {
        access_token: pair.access_token,
        refresh_token: pair.refresh_token,
        token_type: "Bearer",
        expires_in: pair.expires_in,
    }
}

fn confirmation() -> Json<Value> {
    Json(json!({
        "message": "Nëse llogaria ekziston, do të merrni një email së shpejti."
    }))
}
