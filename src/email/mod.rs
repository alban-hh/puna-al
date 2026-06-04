pub mod resend;
pub mod templates;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailMessage {
    pub to: String,
    pub subject: String,
    pub html: String,
}

#[async_trait]
pub trait EmailClient: Send + Sync {
    async fn send(&self, message: &EmailMessage) -> AppResult<()>;
}
