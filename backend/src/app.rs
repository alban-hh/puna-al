use std::sync::Arc;

use axum::http::header::{AUTHORIZATION, CONTENT_TYPE};
use axum::http::{HeaderValue, Method, StatusCode};
use axum::routing::{delete, get, patch, post};
use axum::Router;
use tower::ServiceBuilder;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{Any, CorsLayer};
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

use crate::handler;
use crate::state::AppState;

pub fn build_router(state: Arc<AppState>) -> Router {
    let cors = build_cors(&state);
    let timeout =
        TimeoutLayer::with_status_code(StatusCode::REQUEST_TIMEOUT, state.config.request_timeout());

    let api = Router::new()
        .route("/auth/register", post(handler::auth::register))
        .route("/auth/login", post(handler::auth::login))
        .route("/auth/refresh", post(handler::auth::refresh))
        .route("/auth/logout", post(handler::auth::logout))
        .route("/auth/verify-email", post(handler::auth::verify_email))
        .route(
            "/auth/resend-verification",
            post(handler::auth::resend_verification),
        )
        .route(
            "/auth/forgot-password",
            post(handler::auth::forgot_password),
        )
        .route("/auth/reset-password", post(handler::auth::reset_password))
        .route(
            "/me",
            get(handler::account::me).patch(handler::account::update_me),
        )
        .route("/me/applications", get(handler::application::list_mine))
        .route("/businesses", post(handler::business::create))
        .route("/businesses/mine", get(handler::business::list_mine))
        .route(
            "/businesses/{id}",
            get(handler::business::get).patch(handler::business::update),
        )
        .route(
            "/businesses/{id}/jobs",
            get(handler::job::list_for_business),
        )
        .route(
            "/jobs",
            get(handler::job::list_public).post(handler::job::create),
        )
        .route(
            "/jobs/{id}",
            get(handler::job::get_public)
                .patch(handler::job::update)
                .delete(handler::job::delete),
        )
        .route("/jobs/{id}/publish", post(handler::job::publish))
        .route("/jobs/{id}/close", post(handler::job::close))
        .route("/jobs/{id}/promote", post(handler::job::promote))
        .route(
            "/jobs/{id}/applications",
            get(handler::application::list_for_job).post(handler::application::apply),
        )
        .route(
            "/applications/{id}",
            patch(handler::application::update_status),
        )
        .route("/admin/businesses", get(handler::admin::list_businesses))
        .route(
            "/admin/businesses/{id}/approve",
            post(handler::admin::approve_business),
        )
        .route(
            "/admin/businesses/{id}/reject",
            post(handler::admin::reject_business),
        )
        .route(
            "/admin/businesses/{id}/suspend",
            post(handler::admin::suspend_business),
        )
        .route("/admin/users", get(handler::admin::list_users))
        .route(
            "/admin/users/{id}/suspend",
            post(handler::admin::suspend_user),
        )
        .route("/admin/jobs", get(handler::admin::list_jobs))
        .route("/admin/jobs/{id}", delete(handler::admin::takedown_job))
        .route("/admin/stats", get(handler::admin::stats))
        .route("/meta/qarks", get(handler::meta::qarks))
        .route("/meta/categories", get(handler::meta::categories));

    Router::new()
        .route("/health", get(handler::health::health))
        .route("/verify-email", get(handler::page::verify_email))
        .route("/reset-password", get(handler::page::reset_password_form))
        .nest("/api/v1", api)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(timeout)
                .layer(CompressionLayer::new())
                .layer(cors),
        )
        .with_state(state)
}

fn build_cors(state: &AppState) -> CorsLayer {
    let layer = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE]);

    if state.config.allows_any_origin() {
        return layer.allow_origin(Any);
    }

    let origins: Vec<HeaderValue> = state
        .config
        .cors_origins
        .iter()
        .filter_map(|origin| origin.parse().ok())
        .collect();
    layer.allow_origin(origins)
}
