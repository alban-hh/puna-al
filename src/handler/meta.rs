use axum::Json;

use crate::domain::category::Category;
use crate::domain::qark::Qark;
use crate::dto::meta::MetaItem;

pub async fn qarks() -> Json<Vec<MetaItem>> {
    let items = Qark::ALL
        .iter()
        .map(|qark| MetaItem {
            value: qark.as_str(),
            label: qark.as_str(),
        })
        .collect();
    Json(items)
}

pub async fn categories() -> Json<Vec<MetaItem>> {
    let items = Category::ALL
        .iter()
        .map(|category| MetaItem {
            value: category.as_str(),
            label: category.label_sq(),
        })
        .collect();
    Json(items)
}
