use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use uuid::Uuid;

use crate::dto::business::BusinessSummary;
use crate::dto::common::{Page, PageQuery};
use crate::dto::job::{
    CreateJobRequest, JobDetailResponse, JobListQuery, JobResponse, PromoteJobRequest,
    UpdateJobRequest,
};
use crate::error::AppResult;
use crate::extract::{ValidatedJson, ValidatedQuery};
use crate::middleware::{AuthUser, VerifiedUser};
use crate::service::job::JobPage;
use crate::state::AppState;

pub async fn create(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    ValidatedJson(request): ValidatedJson<CreateJobRequest>,
) -> AppResult<(StatusCode, Json<JobResponse>)> {
    let job = state.job.create(&user, request).await?;
    Ok((StatusCode::CREATED, Json(JobResponse::from(&job))))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    Path(id): Path<Uuid>,
    ValidatedJson(request): ValidatedJson<UpdateJobRequest>,
) -> AppResult<Json<JobResponse>> {
    let job = state.job.update(id, &user, request).await?;
    Ok(Json(JobResponse::from(&job)))
}

pub async fn delete(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    state.job.soft_delete(id, &user).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn publish(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<JobResponse>> {
    let job = state.job.publish(id, &user).await?;
    Ok(Json(JobResponse::from(&job)))
}

pub async fn close(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<JobResponse>> {
    let job = state.job.close(id, &user).await?;
    Ok(Json(JobResponse::from(&job)))
}

pub async fn promote(
    State(state): State<Arc<AppState>>,
    VerifiedUser(user): VerifiedUser,
    Path(id): Path<Uuid>,
    ValidatedJson(request): ValidatedJson<PromoteJobRequest>,
) -> AppResult<Json<JobResponse>> {
    let job = state.job.promote(id, &user, request).await?;
    Ok(Json(JobResponse::from(&job)))
}

pub async fn list_public(
    State(state): State<Arc<AppState>>,
    ValidatedQuery(query): ValidatedQuery<JobListQuery>,
) -> AppResult<Json<Page<JobResponse>>> {
    let JobPage {
        jobs,
        page,
        per_page,
        total,
    } = state.job.list_public(query).await?;
    Ok(Json(Page::new(
        jobs.iter().map(JobResponse::from).collect(),
        page,
        per_page,
        total,
    )))
}

pub async fn get_public(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<JobDetailResponse>> {
    let job = state.job.view_public(id).await?;
    let business = state.business.view(job.business_id, None).await?;
    Ok(Json(JobDetailResponse {
        job: JobResponse::from(&job),
        business: BusinessSummary::from(&business),
    }))
}

pub async fn list_for_business(
    State(state): State<Arc<AppState>>,
    AuthUser(user): AuthUser,
    Path(business_id): Path<Uuid>,
    ValidatedQuery(query): ValidatedQuery<PageQuery>,
) -> AppResult<Json<Page<JobResponse>>> {
    let JobPage {
        jobs,
        page,
        per_page,
        total,
    } = state
        .job
        .list_for_owner(business_id, &user, query.page, query.per_page)
        .await?;
    Ok(Json(Page::new(
        jobs.iter().map(JobResponse::from).collect(),
        page,
        per_page,
        total,
    )))
}
