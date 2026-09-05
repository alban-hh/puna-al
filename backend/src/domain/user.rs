use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::role::Role;
use crate::string_enum;

string_enum!(UserStatus {
    Active => "active",
    Suspended => "suspended",
});

#[derive(Debug, Clone)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub role: Role,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    pub fn is_active(&self) -> bool {
        matches!(self.status, UserStatus::Active)
    }

    pub fn is_verified(&self) -> bool {
        self.email_verified_at.is_some()
    }
}
