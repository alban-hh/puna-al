use async_trait::async_trait;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use uuid::Uuid;

use crate::domain::user::User;
use crate::error::{AppError, AppResult};
use crate::repository::params::{Pagination, UserQuery};
use crate::repository::sqlite::convert::{
    encode_dt, encode_opt_dt, encode_uuid, parse_dt, parse_enum, parse_opt_dt, parse_uuid,
};
use crate::repository::UserRepository;

pub struct SqliteUserRepository {
    pool: SqlitePool,
}

impl SqliteUserRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: String,
    email: String,
    password_hash: String,
    full_name: String,
    phone: Option<String>,
    role: String,
    email_verified_at: Option<String>,
    status: String,
    created_at: String,
    updated_at: String,
}

impl TryFrom<UserRow> for User {
    type Error = AppError;

    fn try_from(row: UserRow) -> AppResult<Self> {
        Ok(User {
            id: parse_uuid(&row.id)?,
            email: row.email,
            password_hash: row.password_hash,
            full_name: row.full_name,
            phone: row.phone,
            role: parse_enum(&row.role)?,
            email_verified_at: parse_opt_dt(row.email_verified_at)?,
            status: parse_enum(&row.status)?,
            created_at: parse_dt(&row.created_at)?,
            updated_at: parse_dt(&row.updated_at)?,
        })
    }
}

const COLUMNS: &str = "id, email, password_hash, full_name, phone, role, \
    email_verified_at, status, created_at, updated_at";

fn push_filters(builder: &mut QueryBuilder<'_, Sqlite>, query: &UserQuery) {
    if let Some(status) = query.status {
        builder.push(" AND status = ").push_bind(status.as_str());
    }
    if let Some(search) = &query.search {
        let pattern = format!("%{}%", search);
        builder
            .push(" AND (email LIKE ")
            .push_bind(pattern.clone())
            .push(" OR full_name LIKE ")
            .push_bind(pattern)
            .push(")");
    }
}

#[async_trait]
impl UserRepository for SqliteUserRepository {
    async fn create(&self, user: &User) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO users (id, email, password_hash, full_name, phone, role, \
             email_verified_at, status, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(encode_uuid(user.id))
        .bind(&user.email)
        .bind(&user.password_hash)
        .bind(&user.full_name)
        .bind(&user.phone)
        .bind(user.role.as_str())
        .bind(encode_opt_dt(user.email_verified_at))
        .bind(user.status.as_str())
        .bind(encode_dt(user.created_at))
        .bind(encode_dt(user.updated_at))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<User>> {
        let row =
            sqlx::query_as::<_, UserRow>(&format!("SELECT {COLUMNS} FROM users WHERE id = ?"))
                .bind(encode_uuid(id))
                .fetch_optional(&self.pool)
                .await?;
        row.map(User::try_from).transpose()
    }

    async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let row =
            sqlx::query_as::<_, UserRow>(&format!("SELECT {COLUMNS} FROM users WHERE email = ?"))
                .bind(email)
                .fetch_optional(&self.pool)
                .await?;
        row.map(User::try_from).transpose()
    }

    async fn update(&self, user: &User) -> AppResult<()> {
        sqlx::query(
            "UPDATE users SET email = ?, password_hash = ?, full_name = ?, phone = ?, \
             role = ?, email_verified_at = ?, status = ?, updated_at = ? WHERE id = ?",
        )
        .bind(&user.email)
        .bind(&user.password_hash)
        .bind(&user.full_name)
        .bind(&user.phone)
        .bind(user.role.as_str())
        .bind(encode_opt_dt(user.email_verified_at))
        .bind(user.status.as_str())
        .bind(encode_dt(user.updated_at))
        .bind(encode_uuid(user.id))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn count_admins(&self) -> AppResult<i64> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'admin'")
            .fetch_one(&self.pool)
            .await?;
        Ok(count)
    }

    async fn list(&self, query: &UserQuery, page: Pagination) -> AppResult<(Vec<User>, i64)> {
        let mut count_builder =
            QueryBuilder::<Sqlite>::new("SELECT COUNT(*) FROM users WHERE 1 = 1");
        push_filters(&mut count_builder, query);
        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(&self.pool)
            .await?;

        let mut builder =
            QueryBuilder::<Sqlite>::new(format!("SELECT {COLUMNS} FROM users WHERE 1 = 1"));
        push_filters(&mut builder, query);
        builder
            .push(" ORDER BY created_at DESC LIMIT ")
            .push_bind(page.limit)
            .push(" OFFSET ")
            .push_bind(page.offset);

        let rows = builder
            .build_query_as::<UserRow>()
            .fetch_all(&self.pool)
            .await?;
        let users = rows
            .into_iter()
            .map(User::try_from)
            .collect::<AppResult<Vec<_>>>()?;
        Ok((users, total))
    }
}
