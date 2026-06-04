use anyhow::anyhow;
use chrono::{DateTime, SecondsFormat, Utc};
use uuid::Uuid;

use crate::error::{AppError, AppResult};

pub fn encode_uuid(id: Uuid) -> String {
    id.to_string()
}

pub fn encode_opt_uuid(id: Option<Uuid>) -> Option<String> {
    id.map(encode_uuid)
}

pub fn encode_dt(value: DateTime<Utc>) -> String {
    value.to_rfc3339_opts(SecondsFormat::Micros, true)
}

pub fn encode_opt_dt(value: Option<DateTime<Utc>>) -> Option<String> {
    value.map(encode_dt)
}

pub fn parse_uuid(value: &str) -> AppResult<Uuid> {
    Uuid::parse_str(value).map_err(|e| AppError::Internal(anyhow!("corrupt uuid in database: {e}")))
}

pub fn parse_opt_uuid(value: Option<String>) -> AppResult<Option<Uuid>> {
    match value {
        Some(raw) => Ok(Some(parse_uuid(&raw)?)),
        None => Ok(None),
    }
}

pub fn parse_dt(value: &str) -> AppResult<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(value)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| AppError::Internal(anyhow!("corrupt timestamp in database: {e}")))
}

pub fn parse_opt_dt(value: Option<String>) -> AppResult<Option<DateTime<Utc>>> {
    match value {
        Some(raw) => Ok(Some(parse_dt(&raw)?)),
        None => Ok(None),
    }
}

pub fn parse_enum<T>(value: &str) -> AppResult<T>
where
    T: std::str::FromStr<Err = AppError>,
{
    value
        .parse()
        .map_err(|_| AppError::Internal(anyhow!("corrupt enum value in database: {value}")))
}
