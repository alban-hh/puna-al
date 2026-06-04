use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::repository::params::Pagination;

const DEFAULT_PER_PAGE: i64 = 20;
const MAX_PER_PAGE: i64 = 100;

#[derive(Debug, Default, Deserialize, Validate)]
pub struct PageQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

pub struct ResolvedPage {
    pub pagination: Pagination,
    pub page: i64,
    pub per_page: i64,
}

pub fn resolve_pagination(page: Option<i64>, per_page: Option<i64>) -> ResolvedPage {
    let per_page = per_page.unwrap_or(DEFAULT_PER_PAGE).clamp(1, MAX_PER_PAGE);
    let page = page.unwrap_or(1).max(1);
    ResolvedPage {
        pagination: Pagination {
            limit: per_page,
            offset: (page - 1) * per_page,
        },
        page,
        per_page,
    }
}

#[derive(Debug, Serialize)]
pub struct Page<T> {
    pub items: Vec<T>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

impl<T> Page<T> {
    pub fn new(items: Vec<T>, page: i64, per_page: i64, total: i64) -> Self {
        Self {
            items,
            page,
            per_page,
            total,
        }
    }
}
