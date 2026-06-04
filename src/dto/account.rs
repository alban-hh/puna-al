use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::role::Role;
use crate::domain::user::{User, UserStatus};
use crate::dto::validators::optional_albanian_phone;

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub role: Role,
    pub status: UserStatus,
    pub email_verified: bool,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<&User> for UserResponse {
    fn from(user: &User) -> Self {
        Self {
            id: user.id,
            email: user.email.clone(),
            full_name: user.full_name.clone(),
            phone: user.phone.clone(),
            role: user.role,
            status: user.status,
            email_verified: user.is_verified(),
            email_verified_at: user.email_verified_at,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateMeRequest {
    #[validate(length(min = 1, max = 120, message = "must be between 1 and 120 characters"))]
    pub full_name: Option<String>,
    #[validate(custom(function = "optional_albanian_phone"))]
    pub phone: Option<String>,
}
