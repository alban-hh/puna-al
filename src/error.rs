use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    Validation(String),

    #[error("authentication is required to access this resource")]
    Unauthorized,

    #[error("invalid email or password")]
    InvalidCredentials,

    #[error("you do not have permission to perform this action")]
    Forbidden,

    #[error("{0}")]
    NotFound(String),

    #[error("{0}")]
    Conflict(String),

    #[error("{0}")]
    BadRequest(String),

    #[error("an internal error occurred")]
    Internal(#[from] anyhow::Error),
}

impl AppError {
    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation(message.into())
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::NotFound(message.into())
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(message.into())
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::BadRequest(message.into())
    }

    fn status(&self) -> StatusCode {
        match self {
            Self::Validation(_) | Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized | Self::InvalidCredentials => StatusCode::UNAUTHORIZED,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn code(&self) -> &'static str {
        match self {
            Self::Validation(_) => "validation_error",
            Self::BadRequest(_) => "bad_request",
            Self::Unauthorized => "unauthorized",
            Self::InvalidCredentials => "invalid_credentials",
            Self::Forbidden => "forbidden",
            Self::NotFound(_) => "not_found",
            Self::Conflict(_) => "conflict",
            Self::Internal(_) => "internal_error",
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        if let Self::Internal(ref source) = self {
            tracing::error!(error = ?source, "request failed with internal error");
        }
        let body = Json(json!({
            "error": self.code(),
            "message": self.to_string(),
        }));
        (self.status(), body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        match &error {
            sqlx::Error::RowNotFound => Self::NotFound("resource not found".into()),
            sqlx::Error::Database(db) if db.is_unique_violation() => {
                Self::Conflict("a resource with the same unique value already exists".into())
            }
            _ => Self::Internal(anyhow::Error::new(error)),
        }
    }
}

impl From<validator::ValidationErrors> for AppError {
    fn from(errors: validator::ValidationErrors) -> Self {
        Self::Validation(flatten_validation_errors(&errors))
    }
}

fn flatten_validation_errors(errors: &validator::ValidationErrors) -> String {
    let mut messages = Vec::new();
    for (field, kind) in errors.errors() {
        match kind {
            validator::ValidationErrorsKind::Field(items) => {
                for item in items {
                    let detail = item
                        .message
                        .as_ref()
                        .map(|m| m.to_string())
                        .unwrap_or_else(|| format!("is invalid ({})", item.code));
                    messages.push(format!("{field} {detail}"));
                }
            }
            validator::ValidationErrorsKind::Struct(nested) => {
                messages.push(format!("{field}: {}", flatten_validation_errors(nested)));
            }
            validator::ValidationErrorsKind::List(entries) => {
                for nested in entries.values() {
                    messages.push(format!("{field}: {}", flatten_validation_errors(nested)));
                }
            }
        }
    }
    if messages.is_empty() {
        "the request payload is invalid".to_string()
    } else {
        messages.join("; ")
    }
}

pub type AppResult<T> = Result<T, AppError>;
