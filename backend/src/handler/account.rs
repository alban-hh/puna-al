use std::sync::Arc;

use axum::extract::State;
use axum::Json;

use crate::dto::account::{UpdateMeRequest, UserResponse};
use crate::error::AppResult;
use crate::extract::ValidatedJson;
use crate::middleware::AuthUser;
use crate::state::AppState;

pub async fn me(AuthUser(user): AuthUser) -> Json<UserResponse> {
    Json(UserResponse::from(&user))
}

pub async fn update_me(
    State(state): State<Arc<AppState>>,
    AuthUser(user): AuthUser,
    ValidatedJson(request): ValidatedJson<UpdateMeRequest>,
) -> AppResult<Json<UserResponse>> {
    let updated = state.account.update_profile(user, request).await?;
    Ok(Json(UserResponse::from(&updated)))
}
