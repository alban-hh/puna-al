# Puna.al

[![CI](https://github.com/alban-hh/puna-al/actions/workflows/ci.yml/badge.svg)](https://github.com/alban-hh/puna-al/actions/workflows/ci.yml)
![Rust](https://img.shields.io/badge/Rust-Axum-000000?logo=rust)
![React](https://img.shields.io/badge/React-TypeScript-3178C6?logo=typescript&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A job board for Albania. Rust REST API and React frontend in one repository.

## Structure

```
backend/    Axum API with SQLite or Postgres via sqlx, JWT auth and a durable email queue
frontend/   React and TypeScript SPA with TanStack Query and Tailwind
docs/       Full API reference
```

## Backend

Handlers call services, services depend only on repository traits, and SQLite and Postgres adapters implement those traits. The database is chosen from the `DATABASE_URL` scheme and migrations run on startup.

```bash
cd backend
cp .env.example .env
cargo run
```

Required variables are `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESEND_API_KEY` and `EMAIL_FROM`. The first admin is seeded from the environment on boot. The health check is `GET /health` and every other route lives under `/api/v1`.

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Point `VITE_API_BASE_URL` at the backend including the `/api/v1` prefix.

## Features

- Registration with email verification, password reset, Argon2 hashing and rotating refresh tokens
- Businesses register with a NIPT and need admin approval before publishing jobs
- Job publishing, promotion, search and filtering by qark and category
- Applications, an admin panel for moderation and platform stats
- Transactional email queued in the database and delivered by a background worker with backoff

## Deploy

The multi-stage `Dockerfile` and `fly.toml` live in `backend/`. Pushes to `master` deploy through GitHub Actions.

## License

MIT
