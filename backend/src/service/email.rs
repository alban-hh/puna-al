use std::sync::Arc;

use anyhow::anyhow;
use chrono::Utc;

use crate::email::templates::{self, Locale};
use crate::email::EmailMessage;
use crate::error::{AppError, AppResult};
use crate::queue::{Queue, EMAIL_JOB_KIND};

pub struct EmailService {
    queue: Arc<dyn Queue>,
    base_url: String,
    locale: Locale,
}

impl EmailService {
    pub fn new(queue: Arc<dyn Queue>, base_url: String) -> Self {
        Self {
            queue,
            base_url: base_url.trim_end_matches('/').to_string(),
            locale: Locale::default(),
        }
    }

    pub async fn send_email_verification(
        &self,
        to: &str,
        full_name: &str,
        raw_token: &str,
    ) -> AppResult<()> {
        let url = format!("{}/verify-email?token={}", self.base_url, raw_token);
        self.enqueue(templates::verification(self.locale, to, full_name, &url))
            .await
    }

    pub async fn send_password_reset(
        &self,
        to: &str,
        full_name: &str,
        raw_token: &str,
    ) -> AppResult<()> {
        let url = format!("{}/reset-password?token={}", self.base_url, raw_token);
        self.enqueue(templates::password_reset(self.locale, to, full_name, &url))
            .await
    }

    pub async fn send_business_submitted(
        &self,
        to: &str,
        full_name: &str,
        business_name: &str,
    ) -> AppResult<()> {
        self.enqueue(templates::business_submitted(
            self.locale,
            to,
            full_name,
            business_name,
        ))
        .await
    }

    pub async fn send_business_approved(
        &self,
        to: &str,
        full_name: &str,
        business_name: &str,
    ) -> AppResult<()> {
        self.enqueue(templates::business_approved(
            self.locale,
            to,
            full_name,
            business_name,
        ))
        .await
    }

    pub async fn send_business_rejected(
        &self,
        to: &str,
        full_name: &str,
        business_name: &str,
        reason: &str,
    ) -> AppResult<()> {
        self.enqueue(templates::business_rejected(
            self.locale,
            to,
            full_name,
            business_name,
            reason,
        ))
        .await
    }

    pub async fn send_application_received(
        &self,
        to: &str,
        owner_name: &str,
        job_title: &str,
        applicant_name: &str,
    ) -> AppResult<()> {
        self.enqueue(templates::application_received(
            self.locale,
            to,
            owner_name,
            job_title,
            applicant_name,
        ))
        .await
    }

    async fn enqueue(&self, message: EmailMessage) -> AppResult<()> {
        let payload = serde_json::to_value(&message)
            .map_err(|e| AppError::Internal(anyhow!("failed to serialize email message: {e}")))?;
        self.queue
            .enqueue(EMAIL_JOB_KIND, payload, Utc::now())
            .await
    }
}
