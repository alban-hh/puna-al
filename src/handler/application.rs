use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::dto::application::{
    ApplicantApplicationResponse, ApplicationResponse, CreateApplicationRequest,
    JobApplicationResponse, UpdateApplicationStatusRequest,
};
use crate::dto::common::{Page, PageQuery};
use crate::error::AppResult;
use crate::extract::{ValidatedJson, ValidatedQuery};
use crate::middleware::{AuthUser, VerifiedUser};
use crate::service::application::{ApplicantApplicationsPage, JobApplicationsPage};
use crate::state::AppState;

pub async fn apply(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    Path(job_id): Path<Uuid>,
    ValidatedJson(request): ValidatedJson<CreateApplicationRequest>,
) -> AppResult<(StatusCode, Json<ApplicationResponse>)> {
    let application = state.application.apply(&user, job_id, request).await?;
    Ok((
        StatusCode::CREATED,
        Json(ApplicationResponse::from(&application)),
    ))
}

pub async fn list_mine(
    State(state): State<Arc<AppState>>,
    AuthUser(user): AuthUser,
    ValidatedQuery(query): ValidatedQuery<PageQuery>,
) -> AppResult<Json<Page<ApplicantApplicationResponse>>> {
    let ApplicantApplicationsPage {
        items,
        page,
        per_page,
        total,
    } = state
        .application
        .list_mine(user.id, query.page, query.per_page)
        .await?;
    Ok(Json(Page::new(
        items
            .iter()
            .map(ApplicantApplicationResponse::from)
            .collect(),
        page,
        per_page,
        total,
    )))
}

pub async fn list_for_job(
    State(state): State<Arc<AppState>>,
    AuthUser(user): AuthUser,
    Path(job_id): Path<Uuid>,
    ValidatedQuery(query): ValidatedQuery<PageQuery>,
) -> AppResult<Json<Page<JobApplicationResponse>>> {
    let JobApplicationsPage {
        items,
        page,
        per_page,
        total,
    } = state
        .application
        .list_for_job(job_id, &user, query.page, query.per_page)
        .await?;
    Ok(Json(Page::new(
        items.iter().map(JobApplicationResponse::from).collect(),
        page,
        per_page,
        total,
    )))
}

pub async fn update_status(
    State(state): State<Arc<AppState>>,
    AuthUser(user): AuthUser,
    Path(application_id): Path<Uuid>,
    ValidatedJson(request): ValidatedJson<UpdateApplicationStatusRequest>,
) -> AppResult<Json<ApplicationResponse>> {
    let application = state
        .application
        .update_status(application_id, &user, request.status)
        .await?;
    Ok(Json(ApplicationResponse::from(&application)))
}
