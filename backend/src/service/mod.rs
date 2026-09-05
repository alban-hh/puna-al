pub mod account;
pub mod admin;
pub mod application;
pub mod auth;
pub mod business;
pub mod email;
pub mod job;

pub struct Paged<T> {
    pub items: Vec<T>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}
