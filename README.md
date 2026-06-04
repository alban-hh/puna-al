# Puna.al — Job Board API

A production-grade REST API backend for a job board in Albania, built with Rust, Axum, Tokio and sqlx.

The architecture is strictly layered so the database can be swapped from SQLite to Postgres (or anything else) with near-zero changes to business logic:

```
handler (thin HTTP)  ->  service (business logic)  ->  repository trait (port)
                                                            └── sqlite implementation (adapter)
```

Services depend only on repository **traits** and never on `sqlx`. All SQL lives inside the SQLite repository implementations. Domain entities, request/response DTOs and persistence rows are separate types.

## Stack

- **Axum** + **Tokio** async runtime
- **sqlx** (SQLite now, runtime queries only — no compile-time `query!` macros)
- **JWT** access tokens (short-lived) + opaque, revocable, rotating refresh tokens
- **Argon2** password hashing
- Durable **background email queue** processed by a worker with exponential backoff
- **Resend** email provider behind a trait
- `validator` for input validation, `thiserror` for a single typed error

## Project layout

```
src/
  main.rs            load config, init tracing, run migrations, seed admin, spawn worker, serve
  app.rs             router + middleware + state wiring
  config.rs          typed Config from env (fails fast on missing/invalid vars)
  state.rs           shared AppState
  error.rs           AppError -> HTTP status + JSON { error, message }
  extract.rs         ValidatedJson / ValidatedQuery extractors
  domain/            entities + enums (pure types, string_enum! macro)
  dto/               request/response types + validators + pagination
  repository/        traits (ports) + sqlite/ implementations (adapters)
  service/           auth, account, business, job, application, admin, email
  handler/           one module per area + meta + health
  middleware/        auth extraction + role/verification guards
  security/          password hashing, jwt, opaque token generation
  email/             EmailClient trait + Resend impl + Albanian templates
  queue/             Queue trait + SQLite impl + polling worker
migrations/          sqlx migrations, run on startup
```

## Setup

Requires a recent stable Rust toolchain.

```bash
cp .env.example .env
# edit .env: set JWT_SECRET (>= 32 chars), ADMIN_EMAIL, ADMIN_PASSWORD,
# RESEND_API_KEY and EMAIL_FROM
```

Migrations are embedded in the binary and run automatically on startup, so there is no separate migration step. (To run them manually you can install the sqlx CLI and use `sqlx migrate run`, but it is not required.)

## Run

```bash
cargo run
```

On startup the server will:

1. Load and validate configuration from the environment.
2. Create the SQLite database file and its parent directory if missing.
3. Run all pending migrations.
4. Seed the admin account (see below).
5. Spawn the background email worker.
6. Start serving on `BIND_ADDR`.

Health check: `GET /health`.

## How the admin is seeded

There is no public admin signup. On startup, if **no** admin user exists yet, one is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The seeded admin is created already verified and active. If an admin already exists, seeding is skipped. If the configured email is already taken by a non-admin user, seeding is skipped with a warning.

## Roles & authorization

- Two roles: `user` and `admin`.
- Any **verified** user can register a business and apply to jobs.
- A business must be **approved by an admin** before its owner can publish/promote jobs — this approval is the activation gate.
- Business and job management is authorized by **ownership**, not role.

## API overview

All endpoints are under `/api/v1` (except `GET /health`). Errors are consistent JSON: `{ "error": "<code>", "message": "<human readable>" }`.

Auth & account: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`; `GET /me`, `PATCH /me`, `GET /me/applications`.

Businesses: `POST /businesses`, `GET /businesses/mine`, `GET /businesses/{id}` (public when approved), `PATCH /businesses/{id}`, `GET /businesses/{id}/jobs` (owner).

Jobs (owner, approved business): `POST /jobs`, `PATCH /jobs/{id}`, `DELETE /jobs/{id}` (soft delete), `POST /jobs/{id}/publish`, `POST /jobs/{id}/close`, `POST /jobs/{id}/promote`.

Jobs (public): `GET /jobs` (filters: `q`, `category`, `qark`, `employment_type`, `city`, `remote`, `featured`; `sort` = `newest|oldest|salary_high|salary_low`; `page`, `per_page`), `GET /jobs/{id}`.

Applications: `POST /jobs/{id}/applications`, `GET /jobs/{id}/applications` (owner), `PATCH /applications/{id}` (owner sets status).

Admin (`admin` role): `GET /admin/businesses?status=`, `POST /admin/businesses/{id}/approve|reject|suspend`, `GET /admin/users?status=&q=`, `POST /admin/users/{id}/suspend`, `GET /admin/jobs?status=&business_id=`, `DELETE /admin/jobs/{id}` (takedown), `GET /admin/stats`.

System / meta: `GET /health`, `GET /api/v1/meta/qarks`, `GET /api/v1/meta/categories`.

Pagination responses are shaped `{ items, page, per_page, total }`.

## Albania specifics

- 12 qarks exposed via `/meta/qarks`.
- NIPT validated as a leading letter, 8 digits, trailing letter (uppercased and unique).
- Phone validated as Albanian `+355` format.
- Salaries are in **ALL**.

## Email & background queue

Outbound email is **never sent inline** in the request path. Each transactional email is rendered (Albanian templates, locale-ready) and **enqueued** as a durable `queue_jobs` row. A single Tokio worker polls due jobs, marks them `processing`, sends via the `EmailClient`, then marks `sent` or reschedules with exponential backoff, failing permanently after `QUEUE_MAX_ATTEMPTS`. Poll interval and batch size come from config. The worker also marks expired jobs (`expires_at` past) as `expired`.

Events: verification on register, business submitted, business approved, business rejected (with reason), new application received, password reset.

## Database backends (SQLite & Postgres)

Both SQLite and Postgres are implemented and selected automatically from the `DATABASE_URL` scheme:

- `sqlite://…` → SQLite (`repository/sqlite/`, migrations in `migrations/sqlite/`). Good for local dev.
- `postgres://…` or `postgresql://…` → Postgres (`repository/postgres/`, migrations in `migrations/postgres/`). Use this in production.

Selection happens in `storage.rs`; services, handlers, DTOs and domain code are identical for both because they depend only on the repository traits. Migrations for the chosen backend run automatically on startup.

Notes for managed Postgres (e.g. Neon):
- The connector tolerates Neon-style URLs: it strips the `channel_binding` parameter (unsupported by sqlx) and disables the prepared-statement cache so it works through Neon's PgBouncer pooler. `sslmode=require` is honoured.
- To add another SQL database, implement the same traits in a new `repository/<db>/` module and add a branch in `storage.rs`.

## Swapping the queue or email provider

- **Queue**: implement the `Queue` trait (`queue/mod.rs`) with another backend (e.g. Redis or Postgres) and construct it in `main.rs`. The worker and `EmailService` are unchanged.
- **Email provider**: implement the `EmailClient` trait (`email/mod.rs`) for another provider and construct it in `main.rs`.

## Deploy to Fly.io (with Neon Postgres)

The repo ships a multi-stage `Dockerfile` (cargo-chef cached build → slim runtime) and a `fly.toml`. The app listens on `0.0.0.0:8080`, which matches `internal_port` in `fly.toml`, so no port wiring is needed. Migrations run on first boot and the admin is seeded automatically.

```bash
# 1. Launch (uses the existing Dockerfile + fly.toml; don't let it overwrite them)
fly launch --no-deploy

# 2. Set secrets (never commit these)
fly secrets set \
  DATABASE_URL='postgresql://USER:PASSWORD@HOST/neondb?sslmode=require' \
  JWT_SECRET='<64-hex-chars>' \
  RESEND_API_KEY='re_...' \
  EMAIL_FROM='Puna.al <noreply@your-verified-domain>' \
  ADMIN_EMAIL='admin@your-domain' \
  ADMIN_PASSWORD='<strong-password>' \
  APP_BASE_URL='https://<your-app>.fly.dev' \
  CORS_ORIGINS='https://<your-frontend-origin>'

# 3. Deploy
fly deploy
```

Notes:
- Pick a `primary_region` close to your database. Neon `eu-central-1` (Frankfurt) pairs with Fly `fra`.
- `min_machines_running = 1` keeps the email worker alive. Set it to `0` to save cost, but then queued emails are only processed while a machine is awake.
- The admin is seeded only if no admin exists; set `ADMIN_EMAIL`/`ADMIN_PASSWORD` before the first deploy and keep them.

## Quality

- No code comments — names and structure carry the meaning.
- No `unwrap`/`expect` in request paths; one central `AppError`.
- `cargo fmt` clean and `cargo clippy -- -D warnings` clean.
