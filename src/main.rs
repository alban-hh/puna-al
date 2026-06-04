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

use std::path::Path;
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
use crate::queue::sqlite::SqliteQueue;
use crate::queue::Queue;
use crate::repository::sqlite::{
    connect_pool, SqliteApplicationRepository, SqliteBusinessRepository, SqliteJobRepository,
    SqliteRefreshTokenRepository, SqliteStatsRepository, SqliteTokenRepository,
    SqliteUserRepository,
};
use crate::repository::{
    ApplicationRepository, BusinessRepository, JobRepository, RefreshTokenRepository,
    StatsRepository, TokenRepository, UserRepository,
};
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
    ensure_sqlite_parent_dir(&config.database_url)?;

    let pool = connect_pool(&config.database_url, 5).await?;
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .context("failed to run database migrations")?;

    let users: Arc<dyn UserRepository> = Arc::new(SqliteUserRepository::new(pool.clone()));
    let businesses: Arc<dyn BusinessRepository> =
        Arc::new(SqliteBusinessRepository::new(pool.clone()));
    let jobs: Arc<dyn JobRepository> = Arc::new(SqliteJobRepository::new(pool.clone()));
    let applications: Arc<dyn ApplicationRepository> =
        Arc::new(SqliteApplicationRepository::new(pool.clone()));
    let tokens: Arc<dyn TokenRepository> = Arc::new(SqliteTokenRepository::new(pool.clone()));
    let refresh_tokens: Arc<dyn RefreshTokenRepository> =
        Arc::new(SqliteRefreshTokenRepository::new(pool.clone()));
    let stats: Arc<dyn StatsRepository> = Arc::new(SqliteStatsRepository::new(pool.clone()));

    let queue: Arc<dyn Queue> = Arc::new(SqliteQueue::new(pool.clone(), config.queue_max_attempts));
    let email_client: Arc<dyn EmailClient> = Arc::new(ResendEmailClient::new(
        config.resend_api_key.clone(),
        config.email_from.clone(),
    ));
    let jwt = Arc::new(JwtService::new(
        &config.jwt_secret,
        config.access_token_ttl(),
    ));
    let email_service = Arc::new(EmailService::new(
        queue.clone(),
        config.app_base_url.clone(),
    ));

    seed_admin(users.as_ref(), &config).await?;

    let auth = AuthService::new(
        users.clone(),
        refresh_tokens.clone(),
        tokens.clone(),
        jwt.clone(),
        email_service.clone(),
        config.access_token_ttl_secs,
        config.refresh_token_ttl(),
        config.email_verification_ttl(),
        config.password_reset_ttl(),
    );
    let account = AccountService::new(users.clone());
    let business = BusinessService::new(businesses.clone(), email_service.clone());
    let job = JobService::new(jobs.clone(), businesses.clone());
    let application = ApplicationService::new(
        applications.clone(),
        jobs.clone(),
        businesses.clone(),
        users.clone(),
        email_service.clone(),
    );
    let admin = AdminService::new(
        users.clone(),
        businesses.clone(),
        jobs.clone(),
        stats.clone(),
        refresh_tokens.clone(),
        email_service.clone(),
    );

    let state = Arc::new(AppState {
        config: config.clone(),
        jwt: jwt.clone(),
        users: users.clone(),
        auth,
        account,
        business,
        job,
        application,
        admin,
    });

    let (shutdown_tx, shutdown_rx) = watch::channel(false);
    let worker = tokio::spawn(queue::worker::run(
        queue.clone(),
        email_client.clone(),
        jobs.clone(),
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

fn ensure_sqlite_parent_dir(database_url: &str) -> anyhow::Result<()> {
    let without_scheme = database_url
        .strip_prefix("sqlite://")
        .or_else(|| database_url.strip_prefix("sqlite:"))
        .unwrap_or(database_url);
    let path_part = without_scheme.split('?').next().unwrap_or(without_scheme);
    if path_part.is_empty() || path_part == ":memory:" {
        return Ok(());
    }

    if let Some(parent) = Path::new(path_part).parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).with_context(|| {
                format!("failed to create database directory {}", parent.display())
            })?;
        }
    }
    Ok(())
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
