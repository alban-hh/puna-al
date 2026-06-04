# Puna.al Job Board — Frontend API Reference

This document describes the entire HTTP API. It is the single source of truth for building the frontend. Everything a client needs is here: base URL, auth, conventions, all enums, all request/response schemas, every endpoint, every status code, and the exact JSON error shape.

---

## 1. Base URL & versioning

- Local dev base URL: `http://localhost:8080`
- Health check (not versioned): `GET /health`
- Every other endpoint is under the prefix: `/api/v1`

So a full URL looks like: `http://localhost:8080/api/v1/jobs`.

All request and response bodies are **JSON**. Send `Content-Type: application/json` on any request that has a body.

---

## 2. Authentication

Auth uses **JWT access tokens** (short-lived) plus an **opaque refresh token** (long-lived, revocable, rotating).

### How it works
1. `POST /api/v1/auth/register` or `POST /api/v1/auth/login` returns both tokens.
2. Send the access token on every authenticated request:
   ```
   Authorization: Bearer <access_token>
   ```
3. The access token expires after `expires_in` seconds (default **900 = 15 minutes**). When it expires (you get `401`), call `POST /api/v1/auth/refresh` with the refresh token to get a **new pair**.
4. **Refresh rotates**: the old refresh token is revoked and a brand-new `refresh_token` is returned. The frontend MUST replace the stored refresh token with the new one each time.

### Token storage tips
- Store the refresh token securely (httpOnly cookie if you have a BFF, otherwise secure storage).
- Default lifetimes: access token 15 min, refresh token 30 days.

### Account state rules that affect auth
- **Suspended** accounts: any authenticated request returns `403`. Login returns `403`.
- **Email not verified**: authenticated reads still work, but actions that require verification return `403` until the email is verified (see the "Auth" column on each endpoint). You do NOT need to log in again after verifying — authorization is re-checked from the database on every request.
- `POST /api/v1/auth/logout` revokes the supplied refresh token. The access token remains valid until it expires (it is short-lived).
- A successful password reset revokes **all** of the user's refresh tokens.

---

## 3. Conventions

### IDs
All resource IDs are **UUID v7 strings**, e.g. `"019e9439-1b5e-7b00-9f57-9f5f01e1bb67"`. Path parameters that are IDs must be valid UUIDs.

### Timestamps
All timestamps are **RFC 3339 / ISO 8601 UTC strings**, e.g. `"2026-06-04T20:10:30.486157Z"`. Fields that can be absent are `null`.

### Salaries
Salaries are integers in **ALL (Albanian Lek)**. The currency is always returned as `"salary_currency": "ALL"`.

### Pagination
List endpoints accept `page` and `per_page` query params and return a **page envelope**:

```json
{
  "items": [ /* array of the resource */ ],
  "page": 1,
  "per_page": 20,
  "total": 137
}
```

- `page`: 1-based. Default `1`. Values `< 1` are treated as `1`.
- `per_page`: default `20`, clamped to the range `1..=100`.
- `total`: total number of matching rows (across all pages).

### Booleans & enums in query strings
- Booleans: `true` / `false` (e.g. `?remote=true`).
- Enum query params must be exact enum values (see §5), e.g. `?qark=Tiranë` (URL-encode it: `qark=Tiran%C3%AB`).

---

## 4. Error format

Every error (from this API's own logic) returns the same JSON shape:

```json
{ "error": "<machine_code>", "message": "<human readable description>" }
```

| HTTP | `error` code         | When it happens |
|------|----------------------|-----------------|
| 400  | `validation_error`   | Input failed field validation. `message` lists the failing fields, joined by `; ` (e.g. `"email must be a valid email address; password must be between 8 and 128 characters"`). |
| 400  | `bad_request`        | Malformed JSON body, malformed query string, an invalid enum value in the body, or a business rule like a missing salary period. `message` describes the problem. |
| 401  | `unauthorized`       | Missing, malformed, or expired access token. |
| 401  | `invalid_credentials`| Wrong email/password on login. |
| 403  | `forbidden`          | Authenticated but not allowed: account suspended, email not verified (for verified-only actions), not the owner of the resource, not an admin, business not approved yet, or applying to your own business's job. |
| 404  | `not_found`          | Resource does not exist, or is not visible to you (e.g. an unapproved business viewed by a stranger, or a draft job). |
| 409  | `conflict`           | Uniqueness/duplication conflict (email already registered, NIPT already used, already applied to a job). |
| 500  | `internal_error`     | Unexpected server error. |

Notes:
- A malformed UUID in a path (e.g. `/jobs/not-a-uuid`) is rejected by the framework with `400` and a **plain-text** body (not the JSON envelope above). Always send valid UUIDs.
- Unknown routes return `404`; wrong HTTP method on a known route returns `405`.

---

## 5. Enums (exact string values)

Send and expect these exact strings. They are the same in JSON bodies, query params, and responses.

### `role`
`user`, `admin`

### `user.status`
`active`, `suspended`

### `business.status`
`pending`, `approved`, `rejected`, `suspended`

### `job.status`
`draft`, `published`, `closed`, `expired`

### `application.status`
`submitted`, `reviewed`, `shortlisted`, `rejected`, `hired`

### `employment_type`
`full_time`, `part_time`, `contract`, `internship`, `temporary`

### `salary_period`
`month`, `year`

### `qark` (12 Albanian counties)
`Berat`, `Dibër`, `Durrës`, `Elbasan`, `Fier`, `Gjirokastër`, `Korçë`, `Kukës`, `Lezhë`, `Shkodër`, `Tiranë`, `Vlorë`

Get them at runtime from `GET /api/v1/meta/qarks`.

### `category` (value → Albanian label)
| value | label |
|-------|-------|
| `information_technology` | Teknologji Informacioni |
| `engineering` | Inxhinieri |
| `finance_accounting` | Financë & Kontabilitet |
| `sales_marketing` | Shitje & Marketing |
| `customer_service` | Shërbim Klienti |
| `administration` | Administratë |
| `human_resources` | Burime Njerëzore |
| `healthcare` | Shëndetësi |
| `education` | Arsim |
| `construction` | Ndërtim |
| `tourism` | Turizëm |
| `hospitality` | Hoteleri & Restorante |
| `retail` | Tregti me Pakicë |
| `transport` | Transport & Logjistikë |
| `manufacturing` | Prodhim |
| `agriculture` | Bujqësi |
| `legal` | Juridik |
| `media_design` | Media & Dizajn |
| `other` | Tjetër |

Get them at runtime from `GET /api/v1/meta/categories`.

### Job listing `sort` values
`newest` (default), `oldest`, `salary_high`, `salary_low`

---

## 6. Albania-specific validation rules

- **NIPT** (business tax ID): exactly 10 characters — one letter, then 8 digits, then one letter (e.g. `K12345678L`). Stored uppercased and must be unique across all businesses.
- **Phone**: Albanian format — must start with `+355` followed by 8 or 9 digits (e.g. `+355681234567`).
- **Salary**: integers, currency ALL. If you send `salary_min` or `salary_max`, you must also send `salary_period`. `salary_max` must be `>= salary_min`.

---

## 7. Response object schemas

These are referenced by the endpoints below. A `?` after a type means the field may be `null`.

### `User`
```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "phone": "string?",
  "role": "user | admin",
  "status": "active | suspended",
  "email_verified": true,
  "email_verified_at": "timestamp?",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### `Tokens`
```json
{
  "access_token": "jwt string",
  "refresh_token": "opaque string",
  "token_type": "Bearer",
  "expires_in": 900
}
```

### `Auth` (returned by register & login)
```json
{ "user": { /* User */ }, "tokens": { /* Tokens */ } }
```

### `Business`
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "name": "string",
  "nipt": "string",
  "description": "string",
  "qark": "Tiranë",
  "city": "string",
  "address": "string",
  "phone": "string",
  "website": "string?",
  "logo_url": "string?",
  "status": "pending | approved | rejected | suspended",
  "rejection_reason": "string?",
  "approved_at": "timestamp?",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### `BusinessSummary` (embedded in job detail)
```json
{ "id": "uuid", "name": "string", "qark": "Tiranë", "city": "string", "website": "string?", "logo_url": "string?" }
```

### `Job`
```json
{
  "id": "uuid",
  "business_id": "uuid",
  "title": "string",
  "description": "string",
  "category": "information_technology",
  "category_label": "Teknologji Informacioni",
  "employment_type": "full_time",
  "qark": "Tiranë",
  "city": "string",
  "remote": true,
  "salary_min": 120000,
  "salary_max": 180000,
  "salary_period": "month",
  "salary_currency": "ALL",
  "status": "published",
  "featured": true,
  "featured_until": "timestamp?",
  "published_at": "timestamp?",
  "expires_at": "timestamp?",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
`salary_min`, `salary_max`, `salary_period` may be `null`. `featured` is computed (`true` if `featured_until` is in the future).

### `JobDetail` (returned by `GET /jobs/{id}`)
A `Job` object with all its fields **plus** an embedded `business`:
```json
{
  /* ...all Job fields... */
  "business": { /* BusinessSummary */ }
}
```

### `Application`
```json
{
  "id": "uuid",
  "job_id": "uuid",
  "applicant_id": "uuid",
  "cover_letter": "string?",
  "cv_url": "string?",
  "status": "submitted | reviewed | shortlisted | rejected | hired",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### `JobApplication` (what the job owner sees — applicant details included)
An `Application` with all its fields **plus** an embedded `applicant`:
```json
{
  /* ...all Application fields... */
  "applicant": { "id": "uuid", "full_name": "string", "email": "string", "phone": "string?" }
}
```

### `ApplicantApplication` (what the applicant sees in "my applications" — job details included)
An `Application` with all its fields **plus** an embedded `job`:
```json
{
  /* ...all Application fields... */
  "job": { "id": "uuid", "title": "string", "city": "string", "business_name": "string" }
}
```

### `Stats` (admin)
```json
{
  "total_users": 0,
  "suspended_users": 0,
  "total_businesses": 0,
  "pending_businesses": 0,
  "approved_businesses": 0,
  "total_jobs": 0,
  "published_jobs": 0,
  "total_applications": 0
}
```

### `MetaItem`
```json
{ "value": "information_technology", "label": "Teknologji Informacioni" }
```

---

## 8. Endpoints

The **Auth** column means:
- **None** — no token needed.
- **Optional** — works without a token, but a valid token unlocks more (e.g. owner can see their own unapproved business).
- **User** — valid token of an active account required.
- **Verified** — valid token of an active **and email-verified** account required.
- **Admin** — valid token of an account with role `admin`.
- **Owner** — must own the targeted resource (enforced in addition to the token requirement; failing returns `403`).

---

### 8.1 System & meta

#### `GET /health`
- Auth: None
- `200` → `{ "status": "ok" }`

#### `GET /api/v1/meta/qarks`
- Auth: None
- `200` → array of `MetaItem` (the 12 qarks; `value` and `label` are identical here).

#### `GET /api/v1/meta/categories`
- Auth: None
- `200` → array of `MetaItem` (value = code, label = Albanian name).

#### `GET /verify-email?token=…`  (HTML page — not under `/api/v1`)
- Auth: None
- This is the page the **verification email link** points to. The backend verifies the token server-side and returns a small HTML confirmation page (Albanian). The frontend does **not** need to implement this — it's handled by the backend.
- For programmatic verification (e.g. if you build your own page), use `POST /api/v1/auth/verify-email` with the token in the body instead.

#### `GET /reset-password?token=…`  (HTML page — not under `/api/v1`)
- Auth: None
- This is the page the **password-reset email link** points to. The backend serves a small HTML form that collects the new password and submits it to `POST /api/v1/auth/reset-password` for you. The frontend does **not** need to implement this.

---

### 8.2 Auth & account

#### `POST /api/v1/auth/register`
- Auth: None
- Body:
  | field | type | required | rules |
  |-------|------|----------|-------|
  | `email` | string | yes | valid email |
  | `password` | string | yes | 8–128 chars |
  | `full_name` | string | yes | 1–120 chars |
  | `phone` | string | no | Albanian `+355…` format |
- `201` → `Auth`. Also enqueues a verification email. The new user starts with `email_verified: false`.
- Errors: `400 validation_error`; `409 conflict` (email already registered).

#### `POST /api/v1/auth/login`
- Auth: None
- Body: `{ "email": string, "password": string }`
- `200` → `Auth`.
- Errors: `400 validation_error`; `401 invalid_credentials` (wrong email or password); `403 forbidden` (account suspended).

#### `POST /api/v1/auth/refresh`
- Auth: None (the refresh token is the credential)
- Body: `{ "refresh_token": string }`
- `200` → `Tokens` (a new pair; the old refresh token is now revoked — store the new one).
- Errors: `401 unauthorized` (unknown/expired/revoked refresh token); `403 forbidden` (account suspended).

#### `POST /api/v1/auth/logout`
- Auth: None
- Body: `{ "refresh_token": string }`
- `204` (no content). Always succeeds even if the token was already invalid.

#### `POST /api/v1/auth/verify-email`
- Auth: None
- Body: `{ "token": string }` (the token from the verification email link `…/verify-email?token=…`)
- `200` → `{ "message": "Email-i u verifikua me sukses." }`
- Errors: `400 bad_request` (invalid or expired token).
- Note: in the default setup the verification email link is handled by the backend page `GET /verify-email` (see §8.1), so you usually don't need to call this endpoint yourself. It exists for when you build your own verification page.

#### `POST /api/v1/auth/resend-verification`
- Auth: None
- Body: `{ "email": string }`
- `202` → `{ "message": "Nëse llogaria ekziston, do të merrni një email së shpejti." }` (intentionally does not reveal whether the email exists).

#### `POST /api/v1/auth/forgot-password`
- Auth: None
- Body: `{ "email": string }`
- `202` → same privacy-preserving message as above. Enqueues a reset email if the account exists and is active.

#### `POST /api/v1/auth/reset-password`
- Auth: None
- Body: `{ "token": string, "password": string }` (`password` 8–128 chars)
- `200` → `{ "message": "Fjalëkalimi u rivendos me sukses." }`. Revokes all of the user's refresh tokens.
- Errors: `400 validation_error`; `400 bad_request` (invalid/expired token).
- Note: in the default setup the reset email link is handled by the backend page `GET /reset-password` (see §8.1), which submits to this endpoint for you.

#### `GET /api/v1/me`
- Auth: User
- `200` → `User`.

#### `PATCH /api/v1/me`
- Auth: User
- Body (all fields optional; only provided fields change):
  | field | type | rules |
  |-------|------|-------|
  | `full_name` | string | 1–120 chars |
  | `phone` | string | Albanian `+355…` format |
- `200` → `User`.

#### `GET /api/v1/me/applications`
- Auth: User
- Query: `page`, `per_page`
- `200` → `Page<ApplicantApplication>` (the current user's own applications, newest first).

---

### 8.3 Businesses

#### `POST /api/v1/businesses`
- Auth: Verified
- Body:
  | field | type | required | rules |
  |-------|------|----------|-------|
  | `name` | string | yes | 2–160 chars |
  | `nipt` | string | yes | Albanian NIPT, unique |
  | `description` | string | yes | 10–5000 chars |
  | `qark` | enum | yes | one of the 12 qarks |
  | `city` | string | yes | 2–120 chars |
  | `address` | string | yes | 5–240 chars |
  | `phone` | string | yes | Albanian `+355…` format |
  | `website` | string | no | valid URL |
  | `logo_url` | string | no | valid URL |
- `201` → `Business` (status starts as `pending`; needs admin approval before its jobs can be published).
- Errors: `400 validation_error`; `403 forbidden` (email not verified); `409 conflict` (NIPT already used).

#### `GET /api/v1/businesses/mine`
- Auth: User
- `200` → array of `Business` (all businesses owned by the current user, any status).

#### `GET /api/v1/businesses/{id}`
- Auth: Optional
- `200` → `Business`. Visible to anyone if the business is `approved`. If it is not approved, only the owner or an admin can see it; everyone else gets `404`.
- Errors: `404 not_found`.

#### `PATCH /api/v1/businesses/{id}`
- Auth: Verified + Owner
- Body (all optional; NIPT cannot be changed):
  | field | rules |
  |-------|-------|
  | `name` | 2–160 chars |
  | `description` | 10–5000 chars |
  | `qark` | enum |
  | `city` | 2–120 chars |
  | `address` | 5–240 chars |
  | `phone` | Albanian `+355…` |
  | `website` | valid URL |
  | `logo_url` | valid URL |
- `200` → `Business`. If the business was `rejected`, editing it resets it to `pending` (re-submitted for review) and clears the rejection reason.
- Errors: `400 validation_error`; `403 forbidden` (not owner / not verified); `404 not_found`.

#### `GET /api/v1/businesses/{id}/jobs`
- Auth: User + Owner
- Query: `page`, `per_page`
- `200` → `Page<Job>` — all jobs of that business (including drafts; excludes deleted), newest first. Use this for the employer dashboard.
- Errors: `403 forbidden` (not owner); `404 not_found`.

---

### 8.4 Jobs — public

#### `GET /api/v1/jobs`
- Auth: None
- Returns only `published`, non-deleted, non-expired jobs.
- Query params (all optional):
  | param | type | notes |
  |-------|------|-------|
  | `page` | int | default 1 |
  | `per_page` | int | default 20, max 100 |
  | `q` | string | full-text-ish match on title/description |
  | `category` | enum | category code |
  | `qark` | enum | one of the 12 qarks |
  | `employment_type` | enum | |
  | `city` | string | partial match |
  | `remote` | bool | |
  | `featured` | bool | if `true`, only currently-featured jobs |
  | `sort` | enum | `newest` (default), `oldest`, `salary_high`, `salary_low` |
- `200` → `Page<Job>`. Featured jobs are ordered first within the chosen sort.

#### `GET /api/v1/jobs/{id}`
- Auth: None
- `200` → `JobDetail` (job + embedded `business` summary). Returns published/closed/expired jobs. Drafts and deleted jobs return `404`.
- Errors: `404 not_found`.

---

### 8.5 Jobs — owner management

All of these require **Verified + Owner** (you must own the business the job belongs to). The business must be `approved` for create/publish/promote.

#### `POST /api/v1/jobs`
- Auth: Verified + Owner (of `business_id`); business must be `approved`
- Body:
  | field | type | required | rules |
  |-------|------|----------|-------|
  | `business_id` | uuid | yes | a business you own & that is approved |
  | `title` | string | yes | 3–160 chars |
  | `description` | string | yes | 20–10000 chars |
  | `category` | enum | yes | |
  | `employment_type` | enum | yes | |
  | `qark` | enum | yes | |
  | `city` | string | yes | 2–120 chars |
  | `remote` | bool | no | default `false` |
  | `salary_min` | int | no | `>= 0`; requires `salary_period` |
  | `salary_max` | int | no | `>= 0`, `>= salary_min`; requires `salary_period` |
  | `salary_period` | enum | no | `month` or `year`; required if any salary is set |
  | `expires_at` | timestamp | no | RFC 3339 |
- `201` → `Job` (status `draft`).
- Errors: `400 validation_error` / `bad_request` (salary rules); `403 forbidden` (not verified / not owner / business not approved); `404 not_found` (business).

#### `PATCH /api/v1/jobs/{id}`
- Auth: Verified + Owner
- Body: any subset of the create fields **except** `business_id`. Same per-field rules; salary cross-field rules re-checked.
- `200` → `Job`.
- Errors: `400`; `403`; `404`.

#### `DELETE /api/v1/jobs/{id}`
- Auth: Verified + Owner
- `204`. Soft-deletes the job (it disappears from all listings).
- Errors: `403`; `404`.

#### `POST /api/v1/jobs/{id}/publish`
- Auth: Verified + Owner; business must be `approved`
- No body.
- `200` → `Job` (status `published`; sets `published_at` if unset; defaults `expires_at` to 30 days out if unset).
- Errors: `403` (not owner / business not approved); `404`.

#### `POST /api/v1/jobs/{id}/close`
- Auth: Verified + Owner
- No body.
- `200` → `Job` (status `closed`).
- Errors: `403`; `404`.

#### `POST /api/v1/jobs/{id}/promote`
- Auth: Verified + Owner; business must be `approved`; job must be `published`
- Body: `{ "days": int }` (1–90). Extends `featured_until` by that many days (from now, or from the existing future `featured_until`).
- `200` → `Job` (`featured: true`).
- Errors: `400 validation_error` (days); `400 bad_request` (job not published); `403`; `404`.

---

### 8.6 Applications

#### `POST /api/v1/jobs/{id}/applications`
- Auth: Verified
- Apply to the job with the given id. You cannot apply to a job belonging to a business you own.
- Body (both optional):
  | field | type | rules |
  |-------|------|-------|
  | `cover_letter` | string | max 5000 chars |
  | `cv_url` | string | valid URL |
- `201` → `Application` (status `submitted`). Notifies the business owner by email.
- Errors: `400 validation_error` (`cover_letter` over 5000 chars, or `cv_url` not a valid URL); `400 bad_request` (job not open / not `published`); `403 forbidden` (not verified, or it's your own business's job); `404 not_found` (job); `409 conflict` (you already applied).

#### `GET /api/v1/jobs/{id}/applications`
- Auth: User + Owner (of the job's business)
- Query: `page`, `per_page`
- `200` → `Page<JobApplication>` (applicants for this job, with their contact details, newest first).
- Errors: `403` (not owner); `404`.

#### `PATCH /api/v1/applications/{id}`
- Auth: User + Owner (of the job's business)
- Body: `{ "status": "submitted | reviewed | shortlisted | rejected | hired" }`
- `200` → `Application` (updated).
- Errors: `400 bad_request` (missing or invalid `status` value); `403` (not owner); `404`.

> Applicant's own list is `GET /api/v1/me/applications` (see §8.2).

---

### 8.7 Admin

All require **Admin**. Non-admins get `403`.

#### `GET /api/v1/admin/businesses`
- Query: `page`, `per_page`, `status` (optional, one of `business.status`).
- `200` → `Page<Business>`.

#### `POST /api/v1/admin/businesses/{id}/approve`
- No body. `200` → `Business` (status `approved`). Emails the owner.
- Errors: `404`.

#### `POST /api/v1/admin/businesses/{id}/reject`
- Body: `{ "reason": string }` (3–1000 chars). `200` → `Business` (status `rejected`, `rejection_reason` set). Emails the owner with the reason.
- Errors: `400 validation_error`; `404`.

#### `POST /api/v1/admin/businesses/{id}/suspend`
- No body. `200` → `Business` (status `suspended`).
- Errors: `404`.

#### `GET /api/v1/admin/users`
- Query: `page`, `per_page`, `status` (optional `active|suspended`), `q` (optional, matches email/full_name).
- `200` → `Page<User>`.

#### `POST /api/v1/admin/users/{id}/suspend`
- No body. `200` → `User` (status `suspended`). Also revokes the user's refresh tokens.
- Errors: `400 bad_request` (cannot suspend an admin account); `404`.

#### `GET /api/v1/admin/jobs`
- Query: `page`, `per_page`, `status` (optional `job.status`), `business_id` (optional uuid).
- `200` → `Page<Job>` (includes drafts and soft-deleted jobs — full admin view).

#### `DELETE /api/v1/admin/jobs/{id}`
- No body. `204`. Takes the job down (soft delete).
- Errors: `404`.

#### `GET /api/v1/admin/stats`
- `200` → `Stats`.

---

## 9. Authorization matrix (quick reference)

| Endpoint | Auth |
|----------|------|
| `GET /health`, `GET /meta/*`, `GET /jobs`, `GET /jobs/{id}` | None |
| `GET /businesses/{id}` | Optional (owner/admin see unapproved) |
| `POST /auth/*` | None |
| `GET/PATCH /me`, `GET /me/applications`, `GET /businesses/mine` | User |
| `GET /businesses/{id}/jobs`, `GET /jobs/{id}/applications`, `PATCH /applications/{id}` | User + Owner |
| `POST /businesses`, `PATCH /businesses/{id}` | Verified (+ Owner for update) |
| `POST/PATCH/DELETE /jobs…`, publish/close/promote | Verified + Owner |
| `POST /jobs/{id}/applications` | Verified |
| `/admin/**` | Admin |

---

## 10. Typical frontend flows

### Sign up → verify → become an employer
1. `POST /auth/register` → store `access_token` + `refresh_token`, show "check your email".
2. User clicks the verification link in the email. It opens the backend page `GET /verify-email?token=…`, which verifies them and shows a confirmation page — no frontend work needed. (Password reset works the same way via `GET /reset-password?token=…`.)
3. `POST /businesses { … }` → business is `pending`.
4. Wait for admin approval (status becomes `approved`; the owner gets an email).
5. `POST /jobs { business_id, … }` → draft, then `POST /jobs/{id}/publish`.
6. Optionally `POST /jobs/{id}/promote { days }`.

### Job seeker
1. Browse `GET /jobs?…filters…` and `GET /jobs/{id}`.
2. Register + verify (steps 1–2 above).
3. `POST /jobs/{id}/applications { cover_letter, cv_url }`.
4. Track via `GET /me/applications`.

### Employer reviewing applicants
1. `GET /businesses/mine` → pick a business.
2. `GET /businesses/{id}/jobs` → pick a job.
3. `GET /jobs/{id}/applications` → see applicants (with contact info).
4. `PATCH /applications/{id} { status }` to move them through the pipeline.

### Admin
1. `POST /auth/login` with the seeded admin credentials.
2. `GET /admin/businesses?status=pending` → review.
3. `POST /admin/businesses/{id}/approve` or `/reject { reason }`.
4. `GET /admin/stats`, `GET /admin/users`, `GET /admin/jobs`, takedowns, suspensions.

### Token refresh (interceptor pattern)
On any `401` with `error: "unauthorized"`:
1. Call `POST /auth/refresh { refresh_token }`.
2. On success, replace BOTH stored tokens with the new pair and retry the original request once.
3. On failure (`401`/`403`), clear tokens and send the user to login.

---

## 11. cURL quickstart

```bash
BASE=http://localhost:8080/api/v1

# register
curl -s -X POST $BASE/auth/register -H 'content-type: application/json' \
  -d '{"email":"me@example.al","password":"password123","full_name":"Test User","phone":"+355681234567"}'

# login
curl -s -X POST $BASE/auth/login -H 'content-type: application/json' \
  -d '{"email":"me@example.al","password":"password123"}'

# authenticated call
curl -s $BASE/me -H "authorization: Bearer <ACCESS_TOKEN>"

# public job search
curl -s "$BASE/jobs?qark=Tiran%C3%AB&category=information_technology&remote=true&sort=salary_high&page=1&per_page=20"
```
