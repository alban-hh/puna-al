CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    email_verified_at TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);

CREATE TABLE businesses (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users (id),
    name TEXT NOT NULL,
    nipt TEXT NOT NULL,
    description TEXT NOT NULL,
    qark TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    logo_url TEXT,
    status TEXT NOT NULL,
    rejection_reason TEXT,
    approved_at TEXT,
    approved_by TEXT REFERENCES users (id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_businesses_nipt ON businesses (nipt);
CREATE INDEX idx_businesses_owner ON businesses (owner_id);
CREATE INDEX idx_businesses_status ON businesses (status);

CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses (id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    qark TEXT NOT NULL,
    city TEXT NOT NULL,
    remote INTEGER NOT NULL DEFAULT 0,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_period TEXT,
    status TEXT NOT NULL,
    featured_until TEXT,
    published_at TEXT,
    expires_at TEXT,
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_jobs_business ON jobs (business_id);
CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_category ON jobs (category);
CREATE INDEX idx_jobs_qark ON jobs (qark);
CREATE INDEX idx_jobs_employment_type ON jobs (employment_type);
CREATE INDEX idx_jobs_published_at ON jobs (published_at);
CREATE INDEX idx_jobs_featured_until ON jobs (featured_until);

CREATE TABLE applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs (id),
    applicant_id TEXT NOT NULL REFERENCES users (id),
    cover_letter TEXT,
    cv_url TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_applications_job_applicant ON applications (job_id, applicant_id);
CREATE INDEX idx_applications_job ON applications (job_id);
CREATE INDEX idx_applications_applicant ON applications (applicant_id);

CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id),
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE verification_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id),
    token_hash TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_verification_tokens_lookup ON verification_tokens (token_hash, purpose);
CREATE INDEX idx_verification_tokens_user ON verification_tokens (user_id);

CREATE TABLE queue_jobs (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL,
    run_at TEXT NOT NULL,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_queue_jobs_due ON queue_jobs (status, run_at);
