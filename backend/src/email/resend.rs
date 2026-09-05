use anyhow::anyhow;
use reqwest::Client;
use serde::Serialize;

use crate::email::{EmailClient, EmailMessage};
use crate::error::{AppError, AppResult};

const RESEND_ENDPOINT: &str = "https://api.resend.com/emails";

pub struct ResendEmailClient {
    http: Client,
    api_key: String,
    from: String,
}

impl ResendEmailClient {
    pub fn new(api_key: String, from: String) -> Self {
        Self {
            http: Client::new(),
            api_key,
            from,
        }
    }
}

#[derive(Serialize)]
struct ResendPayload<'a> {
    from: &'a str,
    to: [&'a str; 1],
    subject: &'a str,
    html: &'a str,
}

#[async_trait::async_trait]
impl EmailClient for ResendEmailClient {
    async fn send(&self, message: &EmailMessage) -> AppResult<()> {
        let payload = ResendPayload {
            from: &self.from,
            to: [message.to.as_str()],
            subject: &message.subject,
            html: &message.html,
        };

        let response = self
            .http
            .post(RESEND_ENDPOINT)
            .bearer_auth(&self.api_key)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::Internal(anyhow!("resend request failed: {e}")))?;

        if response.status().is_success() {
            return Ok(());
        }

        let status = response.status();
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "<no body>".to_string());
        Err(AppError::Internal(anyhow!(
            "resend rejected the email ({status}): {body}"
        )))
    }
}
