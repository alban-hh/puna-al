use std::time::Duration;

use anyhow::{anyhow, Context};

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub bind_addr: String,
    pub jwt_secret: String,
    pub access_token_ttl_secs: i64,
    pub refresh_token_ttl_secs: i64,
    pub email_verification_ttl_secs: i64,
    pub password_reset_ttl_secs: i64,
    pub resend_api_key: String,
    pub email_from: String,
    pub app_base_url: String,
    pub admin_email: String,
    pub admin_password: String,
    pub cors_origins: Vec<String>,
    pub queue_poll_interval_secs: u64,
    pub queue_batch_size: i64,
    pub queue_max_attempts: i64,
    pub request_timeout_secs: u64,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let jwt_secret = required("JWT_SECRET")?;
        if jwt_secret.len() < 32 {
            return Err(anyhow!("JWT_SECRET must be at least 32 characters long"));
        }
        let admin_password = required("ADMIN_PASSWORD")?;
        if admin_password.len() < 8 {
            return Err(anyhow!("ADMIN_PASSWORD must be at least 8 characters long"));
        }

        Ok(Self {
            database_url: optional("DATABASE_URL", "sqlite://data/app.db?mode=rwc"),
            bind_addr: optional("BIND_ADDR", "0.0.0.0:8080"),
            jwt_secret,
            access_token_ttl_secs: parse_or("JWT_ACCESS_TTL_SECS", 900)?,
            refresh_token_ttl_secs: parse_or("JWT_REFRESH_TTL_SECS", 60 * 60 * 24 * 30)?,
            email_verification_ttl_secs: parse_or("EMAIL_VERIFICATION_TTL_SECS", 60 * 60 * 24)?,
            password_reset_ttl_secs: parse_or("PASSWORD_RESET_TTL_SECS", 60 * 60)?,
            resend_api_key: required("RESEND_API_KEY")?,
            email_from: required("EMAIL_FROM")?,
            app_base_url: optional("APP_BASE_URL", "http://localhost:8080"),
            admin_email: required("ADMIN_EMAIL")?,
            admin_password,
            cors_origins: parse_list("CORS_ORIGINS"),
            queue_poll_interval_secs: parse_or("QUEUE_POLL_INTERVAL_SECS", 5)?,
            queue_batch_size: parse_or("QUEUE_BATCH_SIZE", 10)?,
            queue_max_attempts: parse_or("QUEUE_MAX_ATTEMPTS", 5)?,
            request_timeout_secs: parse_or("REQUEST_TIMEOUT_SECS", 30)?,
        })
    }

    pub fn access_token_ttl(&self) -> chrono::Duration {
        chrono::Duration::seconds(self.access_token_ttl_secs)
    }

    pub fn refresh_token_ttl(&self) -> chrono::Duration {
        chrono::Duration::seconds(self.refresh_token_ttl_secs)
    }

    pub fn email_verification_ttl(&self) -> chrono::Duration {
        chrono::Duration::seconds(self.email_verification_ttl_secs)
    }

    pub fn password_reset_ttl(&self) -> chrono::Duration {
        chrono::Duration::seconds(self.password_reset_ttl_secs)
    }

    pub fn request_timeout(&self) -> Duration {
        Duration::from_secs(self.request_timeout_secs)
    }

    pub fn queue_poll_interval(&self) -> Duration {
        Duration::from_secs(self.queue_poll_interval_secs)
    }

    pub fn allows_any_origin(&self) -> bool {
        self.cors_origins.iter().any(|origin| origin == "*")
    }
}

fn required(key: &str) -> anyhow::Result<String> {
    let value = std::env::var(key).with_context(|| format!("missing required env var {key}"))?;
    if value.trim().is_empty() {
        return Err(anyhow!("env var {key} must not be empty"));
    }
    Ok(value)
}

fn optional(key: &str, default: &str) -> String {
    match std::env::var(key) {
        Ok(value) if !value.trim().is_empty() => value,
        _ => default.to_string(),
    }
}

fn parse_or<T>(key: &str, default: T) -> anyhow::Result<T>
where
    T: std::str::FromStr,
    T::Err: std::fmt::Display,
{
    match std::env::var(key) {
        Ok(value) if !value.trim().is_empty() => value
            .trim()
            .parse()
            .map_err(|e| anyhow!("invalid value for env var {key}: {e}")),
        _ => Ok(default),
    }
}

fn parse_list(key: &str) -> Vec<String> {
    std::env::var(key)
        .unwrap_or_default()
        .split(',')
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
        .collect()
}
