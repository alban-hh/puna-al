use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct MetaItem {
    pub value: &'static str,
    pub label: &'static str,
}
