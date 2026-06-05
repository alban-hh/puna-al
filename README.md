# Puna.al — Job Board API

A production REST API for a job board in Albania. Built with **Rust, Axum, Tokio, and sqlx**.

The architecture is strictly layered so the database can be swapped (SQLite ⇄ Postgres ⇄ anything) with near-zero changes to business logic:

```
handler (thin HTTP) → service (business logic) → repository trait (port)
                                                    └─ db implementation (adapter)
```

Services depend only on repository **traits**, never on `sqlx`. All SQL lives in the repository adapters. Domain entities, DTOs, and persistence rows are distinct types.

## Stack

- **Axum** + **Tokio** async runtime
- **sqlx** — runtime queries (no compile-time macros); SQLite and Postgres backends
- **JWT** access tokens + opaque, revocable, rotating refresh tokens
- **Argon2** password hashing
- Durable **email queue** with a polling worker and exponential backoff
- **Resend** email provider behind a trait
- `validator` for input, `thiserror` for one typed `AppError`

## Project layout

```
src/
  main.rs        config, tracing, migrations, admin seed, worker, serve
  app.rs         router + middleware + state
  config.rs      typed Config from env (fails fast)
  error.rs       AppError → HTTP status + JSON { error, message }
  domain/        entities + enums
  dto/           requests, responses, validators, pagination
  repository/    traits + sqlite/ and postgres/ adapters
  service/       auth, account, business, job, application, admin, email
  handler/       one module per area + meta + health
  middleware/    auth extraction + role/verification guards
  security/      password hashing, jwt, opaque tokens
  email/         EmailClient trait + Resend impl + Albanian templates
  queue/         Queue trait + SQLite impl + polling worker
  storage.rs     picks the backend from DATABASE_URL
migrations/      sqlite/ and postgres/, embedded and run on startup
```

## Quick start

```bash
cp .env.example .env
# Required: DATABASE_URL, JWT_SECRET (≥32 chars), ADMIN_EMAIL, ADMIN_PASSWORD,
#           RESEND_API_KEY, EMAIL_FROM
cargo run
```

On startup the server loads config, creates the SQLite file and its parent dir if missing, runs pending migrations for the selected backend, seeds the admin, spawns the email worker, and serves on `BIND_ADDR`. Health check: `GET /health`.

**Admin seeding.** No public admin signup. If no admin exists, one is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, already verified and active. Skipped if an admin already exists, or (with a warning) if the email belongs to a non-admin user.

## Roles & authorization

Two roles: `user` and `admin`.

- Any **verified** user can register a business and apply to jobs.
- A business must be **approved by an admin** before its owner can publish or promote jobs — approval is the activation gate.
- Business and job management is authorized by **ownership**, not role.

## API

All endpoints live under `/api/v1` (except `GET /health`). Errors are consistent JSON (`{ error, message }`) and list responses are shaped `{ items, page, per_page, total }`. Routes cover auth/account, businesses, jobs (owner + public), applications, admin, and meta — see the handler modules in `src/handler/` for the full surface.

## Albania specifics

- 12 qarks via `/meta/qarks`.
- NIPT: leading letter + 8 digits + trailing letter, uppercased and unique.
- Phone: Albanian `+355` format.
- Salaries in **ALL**.

## Email queue

Email is never sent inline in the request path. Each transactional email is rendered (Albanian templates) and enqueued as a durable `queue_jobs` row. A single Tokio worker polls due jobs, marks them `processing`, sends via `EmailClient`, then marks `sent` or reschedules with exponential backoff — failing permanently after `QUEUE_MAX_ATTEMPTS`. Jobs past `expires_at` are marked `expired`. Poll interval and batch size are configurable.

Events: verification on register, business submitted/approved/rejected, new application, password reset.

## Database backends

The backend is chosen automatically from the `DATABASE_URL` scheme in `storage.rs`:

- `sqlite://…` → SQLite (`repository/sqlite/`, `migrations/sqlite/`) — local dev.
- `postgres://…` → Postgres (`repository/postgres/`, `migrations/postgres/`) — production.

Services, handlers, DTOs, and domain code are identical across backends since they depend only on the traits. Migrations for the chosen backend run on startup.

**Managed Postgres (Neon):** the connector strips the unsupported `channel_binding` param, disables the prepared-statement cache (for the PgBouncer pooler), and honours `sslmode=require`. To add another SQL database, implement the traits in a new `repository/<db>/` and add a branch in `storage.rs`.

## Extending

- **Queue** — implement the `Queue` trait (`queue/mod.rs`) with another backend (Redis, Postgres, …) and wire it in `main.rs`. The worker and `EmailService` are unchanged.
- **Email** — implement the `EmailClient` trait (`email/mod.rs`) and construct it in `main.rs`.

## Deploy (Fly.io + Neon Postgres)

The repo ships a multi-stage `Dockerfile` (cargo-chef cached build → slim runtime) and `fly.toml`. The app listens on `0.0.0.0:8080`, matching `internal_port`. Migrations run on first boot and the admin is seeded automatically.

```bash
fly launch --no-deploy   # keep the existing Dockerfile + fly.toml

fly secrets set \
  DATABASE_URL='postgresql://USER:PASSWORD@HOST/neondb?sslmode=require' \
  JWT_SECRET='<64-hex-chars>' \
  RESEND_API_KEY='re_...' \
  EMAIL_FROM='Puna.al <noreply@your-verified-domain>' \
  ADMIN_EMAIL='admin@your-domain' \
  ADMIN_PASSWORD='<strong-password>' \
  APP_BASE_URL='https://<your-app>.fly.dev' \
  CORS_ORIGINS='https://<your-frontend-origin>'

fly deploy
```

- Pick a `primary_region` near your database (Neon `eu-central-1` ↔ Fly `fra`).
- `min_machines_running = 1` keeps the email worker alive; `0` saves cost but only processes the queue while a machine is awake.
- Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` before the first deploy and keep them — the admin seeds only once.

## Quality

- No code comments — names and structure carry meaning.
- No `unwrap` / `expect` in request paths; one central `AppError`.
- `cargo fmt` and `cargo clippy -- -D warnings` clean.
