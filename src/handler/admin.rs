use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::dto::account::UserResponse;
use crate::dto::admin::{
    AdminBusinessListQuery, AdminJobListQuery, AdminUserListQuery, RejectBusinessRequest,
    StatsResponse,
};
use crate::dto::business::BusinessResponse;
use crate::dto::common::Page;
use crate::dto::job::JobResponse;
use crate::error::AppResult;
use crate::extract::{ValidatedJson, ValidatedQuery};
use crate::middleware::AdminUser;
use crate::service::Paged;
use crate::state::AppState;

pub async fn list_businesses(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
    ValidatedQuery(query): ValidatedQuery<AdminBusinessListQuery>,
) -> AppResult<Json<Page<BusinessResponse>>> {
    let Paged {
        items,
        page,
        per_page,
        total,
    } = state.admin.list_businesses(query).await?;
    Ok(Json(Page::new(
        items.iter().map(BusinessResponse::from).collect(),
        page,
        per_page,
        total,
    )))
}

pub async fn approve_business(
    State(state): State<Arc<AppState>>,
    AdminUser(admin): AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<BusinessResponse>> {
    let business = state.admin.approve_business(&admin, id).await?;
    Ok(Json(BusinessResponse::from(&business)))
}

pub async fn reject_business(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
    Path(id): Path<Uuid>,
    ValidatedJson(request): ValidatedJson<RejectBusinessRequest>,
) -> AppResult<Json<BusinessResponse>> {
    let business = state.admin.reject_business(id, request.reason).await?;
    Ok(Json(BusinessResponse::from(&business)))
}

pub async fn suspend_business(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<BusinessResponse>> {
    let business = state.admin.suspend_business(id).await?;
    Ok(Json(BusinessResponse::from(&business)))
}

pub async fn list_users(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
    ValidatedQuery(query): ValidatedQuery<AdminUserListQuery>,
) -> AppResult<Json<Page<UserResponse>>> {
    let Paged {
        items,
        page,
        per_page,
        total,
    } = state.admin.list_users(query).await?;
    Ok(Json(Page::new(
        items.iter().map(UserResponse::from).collect(),
        page,
        per_page,
        total,
    )))
}

pub async fn suspend_user(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<UserResponse>> {
    let user = state.admin.suspend_user(id).await?;
    Ok(Json(UserResponse::from(&user)))
}

pub async fn list_jobs(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
    ValidatedQuery(query): ValidatedQuery<AdminJobListQuery>,
) -> AppResult<Json<Page<JobResponse>>> {
    let Paged {
        items,
        page,
        per_page,
        total,
    } = state.admin.list_jobs(query).await?;
    Ok(Json(Page::new(
        items.iter().map(JobResponse::from).collect(),
        page,
        per_page,
        total,
    )))
}

pub async fn takedown_job(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    state.admin.takedown_job(id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn stats(
    State(state): State<Arc<AppState>>,
    AdminUser(_): AdminUser,
) -> AppResult<Json<StatsResponse>> {
    let stats = state.admin.stats().await?;
    Ok(Json(StatsResponse::from(stats)))
}
