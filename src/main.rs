mod app;
mod config;
mod domain;
mod dto;
mod email;
mod error;
mod extract;
mod handler;
mod middleware;
mod queue;
mod repository;
mod security;
mod service;
mod state;
mod storage;

use std::sync::Arc;

use anyhow::Context;
use chrono::Utc;
use tokio::sync::watch;
use uuid::Uuid;

use crate::config::Config;
use crate::domain::role::Role;
use crate::domain::user::{User, UserStatus};
use crate::email::resend::ResendEmailClient;
use crate::email::EmailClient;
use crate::repository::UserRepository;
use crate::security::jwt::JwtService;
use crate::security::password::hash_password;
use crate::service::account::AccountService;
use crate::service::admin::AdminService;
use crate::service::application::ApplicationService;
use crate::service::auth::AuthService;
use crate::service::business::BusinessService;
use crate::service::email::EmailService;
use crate::service::job::JobService;
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    init_tracing();

    let config = Arc::new(Config::from_env()?);
    let storage = storage::connect(&config).await?;

    let email_client: Arc<dyn EmailClient> = Arc::new(ResendEmailClient::new(
        config.resend_api_key.clone(),
        config.email_from.clone(),
    ));
    let jwt = Arc::new(JwtService::new(&config.jwt_secret, config.access_token_ttl()));
    let email_service = Arc::new(EmailService::new(
        storage.queue.clone(),
        config.app_base_url.clone(),
    ));

    seed_admin(storage.users.as_ref(), &config).await?;

    let auth = AuthService::new(
        storage.users.clone(),
        storage.refresh_tokens.clone(),
        storage.tokens.clone(),
        jwt.clone(),
        email_service.clone(),
        config.access_token_ttl_secs,
        config.refresh_token_ttl(),
        config.email_verification_ttl(),
        config.password_reset_ttl(),
    );
    let account = AccountService::new(storage.users.clone());
    let business = BusinessService::new(storage.businesses.clone(), email_service.clone());
    let job = JobService::new(storage.jobs.clone(), storage.businesses.clone());
    let application = ApplicationService::new(
        storage.applications.clone(),
        storage.jobs.clone(),
        storage.businesses.clone(),
        storage.users.clone(),
        email_service.clone(),
    );
    let admin = AdminService::new(
        storage.users.clone(),
        storage.businesses.clone(),
        storage.jobs.clone(),
        storage.stats.clone(),
        storage.refresh_tokens.clone(),
        email_service.clone(),
    );

    let state = Arc::new(AppState {
        config: config.clone(),
        jwt: jwt.clone(),
        users: storage.users.clone(),
        auth,
        account,
        business,
        job,
        application,
        admin,
    });

    let (shutdown_tx, shutdown_rx) = watch::channel(false);
    let worker = tokio::spawn(queue::worker::run(
        storage.queue.clone(),
        email_client.clone(),
        storage.jobs.clone(),
        config.queue_poll_interval(),
        config.queue_batch_size,
        shutdown_rx,
    ));

    let router = app::build_router(state);
    let listener = tokio::net::TcpListener::bind(&config.bind_addr)
        .await
        .with_context(|| format!("failed to bind to {}", config.bind_addr))?;
    tracing::info!(address = %config.bind_addr, "server is listening");

    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .context("server error")?;

    let _ = shutdown_tx.send(true);
    let _ = worker.await;
    Ok(())
}

async fn seed_admin(users: &dyn UserRepository, config: &Config) -> anyhow::Result<()> {
    if users.count_admins().await? > 0 {
        return Ok(());
    }

    let email = config.admin_email.trim().to_lowercase();
    if users.find_by_email(&email).await?.is_some() {
        tracing::warn!("the configured admin email is already in use; skipping admin seed");
        return Ok(());
    }

    let now = Utc::now();
    let admin = User {
        id: Uuid::now_v7(),
        email,
        password_hash: hash_password(&config.admin_password)?,
        full_name: "Administrator".to_string(),
        phone: None,
        role: Role::Admin,
        email_verified_at: Some(now),
        status: UserStatus::Active,
        created_at: now,
        updated_at: now,
    };
    users.create(&admin).await?;
    tracing::info!(email = %admin.email, "seeded initial admin account");
    Ok(())
}

fn init_tracing() {
    use tracing_subscriber::{fmt, EnvFilter};

    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,backend_job=debug,tower_http=info"));
    fmt().with_env_filter(filter).init();
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(error) => tracing::error!(?error, "failed to install terminate signal handler"),
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {}
        _ = terminate => {}
    }
    tracing::info!("shutdown signal received, stopping");
}
