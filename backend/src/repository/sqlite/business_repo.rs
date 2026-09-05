use async_trait::async_trait;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use uuid::Uuid;

use crate::domain::business::Business;
use crate::error::{AppError, AppResult};
use crate::repository::params::{BusinessQuery, Pagination};
use crate::repository::sqlite::convert::{
    encode_dt, encode_opt_dt, encode_opt_uuid, encode_uuid, parse_dt, parse_enum, parse_opt_dt,
    parse_opt_uuid, parse_uuid,
};
use crate::repository::BusinessRepository;

pub struct SqliteBusinessRepository {
    pool: SqlitePool,
}

impl SqliteBusinessRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct BusinessRow {
    id: String,
    owner_id: String,
    name: String,
    nipt: String,
    description: String,
    qark: String,
    city: String,
    address: String,
    phone: String,
    website: Option<String>,
    logo_url: Option<String>,
    status: String,
    rejection_reason: Option<String>,
    approved_at: Option<String>,
    approved_by: Option<String>,
    created_at: String,
    updated_at: String,
}

impl TryFrom<BusinessRow> for Business {
    type Error = AppError;

    fn try_from(row: BusinessRow) -> AppResult<Self> {
        Ok(Business {
            id: parse_uuid(&row.id)?,
            owner_id: parse_uuid(&row.owner_id)?,
            name: row.name,
            nipt: row.nipt,
            description: row.description,
            qark: parse_enum(&row.qark)?,
            city: row.city,
            address: row.address,
            phone: row.phone,
            website: row.website,
            logo_url: row.logo_url,
            status: parse_enum(&row.status)?,
            rejection_reason: row.rejection_reason,
            approved_at: parse_opt_dt(row.approved_at)?,
            approved_by: parse_opt_uuid(row.approved_by)?,
            created_at: parse_dt(&row.created_at)?,
            updated_at: parse_dt(&row.updated_at)?,
        })
    }
}

const COLUMNS: &str = "id, owner_id, name, nipt, description, qark, city, address, phone, \
    website, logo_url, status, rejection_reason, approved_at, approved_by, created_at, updated_at";

#[async_trait]
impl BusinessRepository for SqliteBusinessRepository {
    async fn create(&self, business: &Business) -> AppResult<()> {
        sqlx::query(
            "INSERT INTO businesses (id, owner_id, name, nipt, description, qark, city, address, \
             phone, website, logo_url, status, rejection_reason, approved_at, approved_by, \
             created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(encode_uuid(business.id))
        .bind(encode_uuid(business.owner_id))
        .bind(&business.name)
        .bind(&business.nipt)
        .bind(&business.description)
        .bind(business.qark.as_str())
        .bind(&business.city)
        .bind(&business.address)
        .bind(&business.phone)
        .bind(&business.website)
        .bind(&business.logo_url)
        .bind(business.status.as_str())
        .bind(&business.rejection_reason)
        .bind(encode_opt_dt(business.approved_at))
        .bind(encode_opt_uuid(business.approved_by))
        .bind(encode_dt(business.created_at))
        .bind(encode_dt(business.updated_at))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Business>> {
        let row = sqlx::query_as::<_, BusinessRow>(&format!(
            "SELECT {COLUMNS} FROM businesses WHERE id = ?"
        ))
        .bind(encode_uuid(id))
        .fetch_optional(&self.pool)
        .await?;
        row.map(Business::try_from).transpose()
    }

    async fn find_by_nipt(&self, nipt: &str) -> AppResult<Option<Business>> {
        let row = sqlx::query_as::<_, BusinessRow>(&format!(
            "SELECT {COLUMNS} FROM businesses WHERE nipt = ?"
        ))
        .bind(nipt)
        .fetch_optional(&self.pool)
        .await?;
        row.map(Business::try_from).transpose()
    }

    async fn list_by_owner(&self, owner_id: Uuid) -> AppResult<Vec<Business>> {
        let rows = sqlx::query_as::<_, BusinessRow>(&format!(
            "SELECT {COLUMNS} FROM businesses WHERE owner_id = ? ORDER BY created_at DESC"
        ))
        .bind(encode_uuid(owner_id))
        .fetch_all(&self.pool)
        .await?;
        rows.into_iter().map(Business::try_from).collect()
    }

    async fn update(&self, business: &Business) -> AppResult<()> {
        sqlx::query(
            "UPDATE businesses SET name = ?, nipt = ?, description = ?, qark = ?, city = ?, \
             address = ?, phone = ?, website = ?, logo_url = ?, status = ?, rejection_reason = ?, \
             approved_at = ?, approved_by = ?, updated_at = ? WHERE id = ?",
        )
        .bind(&business.name)
        .bind(&business.nipt)
        .bind(&business.description)
        .bind(business.qark.as_str())
        .bind(&business.city)
        .bind(&business.address)
        .bind(&business.phone)
        .bind(&business.website)
        .bind(&business.logo_url)
        .bind(business.status.as_str())
        .bind(&business.rejection_reason)
        .bind(encode_opt_dt(business.approved_at))
        .bind(encode_opt_uuid(business.approved_by))
        .bind(encode_dt(business.updated_at))
        .bind(encode_uuid(business.id))
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list(
        &self,
        query: &BusinessQuery,
        page: Pagination,
    ) -> AppResult<(Vec<Business>, i64)> {
        let mut count_builder =
            QueryBuilder::<Sqlite>::new("SELECT COUNT(*) FROM businesses WHERE 1 = 1");
        if let Some(status) = query.status {
            count_builder
                .push(" AND status = ")
                .push_bind(status.as_str());
        }
        let total: i64 = count_builder
            .build_query_scalar()
            .fetch_one(&self.pool)
            .await?;

        let mut builder =
            QueryBuilder::<Sqlite>::new(format!("SELECT {COLUMNS} FROM businesses WHERE 1 = 1"));
        if let Some(status) = query.status {
            builder.push(" AND status = ").push_bind(status.as_str());
        }
        builder
            .push(" ORDER BY created_at DESC LIMIT ")
            .push_bind(page.limit)
            .push(" OFFSET ")
            .push_bind(page.offset);

        let rows = builder
            .build_query_as::<BusinessRow>()
            .fetch_all(&self.pool)
            .await?;
        let businesses = rows
            .into_iter()
            .map(Business::try_from)
            .collect::<AppResult<Vec<_>>>()?;
        Ok((businesses, total))
    }
}
