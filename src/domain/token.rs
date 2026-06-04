use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::string_enum;

string_enum!(TokenPurpose {
    EmailVerification => "email_verification",
    PasswordReset => "password_reset",
});

#[derive(Debug, Clone)]
pub struct VerificationToken {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub purpose: TokenPurpose,
    pub expires_at: DateTime<Utc>,
    pub used_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
