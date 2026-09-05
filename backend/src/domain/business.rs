use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::qark::Qark;
use crate::string_enum;

string_enum!(BusinessStatus {
    Pending => "pending",
    Approved => "approved",
    Rejected => "rejected",
    Suspended => "suspended",
});

#[derive(Debug, Clone)]
pub struct Business {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub name: String,
    pub nipt: String,
    pub description: String,
    pub qark: Qark,
    pub city: String,
    pub address: String,
    pub phone: String,
    pub website: Option<String>,
    pub logo_url: Option<String>,
    pub status: BusinessStatus,
    pub rejection_reason: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub approved_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Business {
    pub fn is_approved(&self) -> bool {
        matches!(self.status, BusinessStatus::Approved)
    }

    pub fn is_visible_publicly(&self) -> bool {
        matches!(self.status, BusinessStatus::Approved)
    }
}
