# Puna.al — Frontend

Production frontend for the **Puna.al** Albanian job board, built against the HTTP API documented in
[`../API.md`](../API.md) (the single source of truth for every endpoint, payload, and error shape).

The interface is in **Albanian**, salaries are shown in **Lekë (ALL)**, and the qark/category selectors
are populated live from the backend meta endpoints.

---

## Stack

| Concern            | Choice                                            |
| ------------------ | ------------------------------------------------- |
| Build tool         | Vite 6                                            |
| UI                 | React 18 + TypeScript (strict)                    |
| Server state       | TanStack Query v5                                 |
| Routing            | React Router v6                                   |
| Forms + validation | react-hook-form + zod                             |
| Styling            | Tailwind CSS v4 (CSS-first theme)                 |
| Icons              | lucide-react                                      |
| Dates              | date-fns (Albanian `sq` locale)                   |

---

## Prerequisites

- **Node.js 20+** and npm.
- A running Puna.al backend. You can point at either:
  - a **local** backend (`http://localhost:8080`), or
  - the **deployed** backend (`https://backend-job.fly.dev`).

The backend must allow the frontend origin via CORS. By default it allows `http://localhost:5173`
(Vite) and `http://localhost:3000`.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file from the template
cp .env.example .env

# 3. Edit .env and set the API base URL (see below)

# 4. Start the dev server (http://localhost:5173)
npm run dev
```

### Environment variables

Configuration is **entirely** via environment variables — no secrets live in the repo.
Every required variable is listed in [`.env.example`](.env.example):

| Variable            | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | yes      | Base URL of the backend **including the `/api/v1` prefix**.                  |

Examples:

```dotenv
# Local backend
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Deployed backend
VITE_API_BASE_URL=https://backend-job.fly.dev/api/v1
```

> The app throws a clear startup error if `VITE_API_BASE_URL` is missing.

---

## Scripts

| Script                 | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the Vite dev server on port 5173        |
| `npm run build`        | Type-check (`tsc -b`) and build for production |
| `npm run preview`      | Preview the production build locally          |
| `npm run typecheck`    | Type-check without emitting                   |
| `npm run lint`         | Run ESLint                                    |
| `npm run format`       | Format `src` with Prettier                    |

---

## Using the app

- **Job seekers** browse and filter jobs on the home page, open a job, register/verify their email,
  then apply.
- **Employers** register a business (`/businesses/new`), wait for admin approval, then post, publish
  and promote jobs and review applicants from the business dashboard.
- **Admins** log in with the seeded admin credentials (backend `ADMIN_EMAIL` / `ADMIN_PASSWORD`) and
  manage the platform at `/admin` (approve/reject/suspend businesses, suspend users, take down jobs,
  view stats).

### Email verification & password reset links

Backend emails link to `…/verify-email?token=…` and `…/reset-password?token=…`. The matching routes
read the `token` from the query string and call the API. Set the backend's `APP_BASE_URL` to this
frontend's origin so those links land here.

---

## Architecture

```
src/
  api/              Typed API client, endpoints, types, query keys, React Query hooks
    client.ts         fetch wrapper: query building, transparent 401 refresh-and-retry, error normalization
    tokenStore.ts     access token in memory, rotating refresh token persisted
    endpoints/        one module per API domain
    hooks/            TanStack Query hooks (queries + mutations with cache invalidation)
  components/
    ui/               design-system primitives (Button, Input, Select, Modal, Badge, …)
    layout/           Navbar, Footer, Container, PageHeader, RootLayout
    feedback/         QueryBoundary, EmptyState, ErrorState, loaders
    forms/            meta-driven selects (qark, category, employment type)
  context/          AuthProvider (session bootstrap), ToastProvider
  features/         feature-first screens: auth, account, jobs, businesses, applications, admin
  routes/           route tree + guards (RequireAuth, RequireAdmin)
  validation/       zod field validators (NIPT, +355 phone, URLs)
  lib/              env, formatting, labels, query client, cn helper
```

### Auth & token handling

- The short-lived **access token** is kept **in memory** only.
- The rotating **refresh token** is persisted in `localStorage`.
- On any `401`, the client performs a **single-flight** `POST /auth/refresh`, stores the new token
  pair, and retries the original request **once**. If refresh fails, the session is cleared and the
  user is sent to login.

### Route protection

- **By auth** — account areas redirect anonymous users to `/login` (preserving the return path).
- **By role** — `/admin/**` requires an `admin` account.
- **By verification** — verified-only actions (create business / post job / apply) are gated with an
  inline "verify your email" prompt.
- **By ownership** — business/job management is owner-only; the API enforces it and the UI surfaces
  the resulting messages.

### Albania specifics

- **NIPT**: 10 chars — letter, 8 digits, letter (e.g. `K12345678L`), validated client-side and
  uppercased.
- **Phone**: `+355` followed by 8–9 digits.
- **Salaries**: integers in ALL, rendered as `120.000 – 180.000 Lekë / muaj`.
- **Qarks & categories**: loaded from `GET /meta/qarks` and `GET /meta/categories`.
```
