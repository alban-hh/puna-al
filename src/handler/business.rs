use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::dto::business::{BusinessResponse, CreateBusinessRequest, UpdateBusinessRequest};
use crate::error::AppResult;
use crate::extract::ValidatedJson;
use crate::middleware::{AuthUser, OptionalUser, VerifiedUser};
use crate::state::AppState;

pub async fn create(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    ValidatedJson(request): ValidatedJson<CreateBusinessRequest>,
) -> AppResult<(StatusCode, Json<BusinessResponse>)> {
    let business = state.business.create(&user, request).await?;
    Ok((StatusCode::CREATED, Json(BusinessResponse::from(&business))))
}

pub async fn list_mine(
    State(state): State<Arc<AppState>>,
    AuthUser(user): AuthUser,
) -> AppResult<Json<Vec<BusinessResponse>>> {
    let businesses = state.business.list_mine(user.id).await?;
    Ok(Json(
        businesses.iter().map(BusinessResponse::from).collect(),
    ))
}

pub async fn get(
    State(state): State<Arc<AppState>>,
    OptionalUser(viewer): OptionalUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<BusinessResponse>> {
    let business = state.business.view(id, viewer.as_ref()).await?;
    Ok(Json(BusinessResponse::from(&business)))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    Path(id): Path<Uuid>,
    ValidatedJson(request): ValidatedJson<UpdateBusinessRequest>,
) -> AppResult<Json<BusinessResponse>> {
    let business = state.business.update(id, &user, request).await?;
    Ok(Json(BusinessResponse::from(&business)))
}
