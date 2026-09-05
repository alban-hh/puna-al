use std::sync::Arc;

use chrono::Utc;

use crate::domain::user::User;
use crate::dto::account::UpdateMeRequest;
use crate::error::AppResult;
use crate::repository::UserRepository;

pub struct AccountService {
    users: Arc<dyn UserRepository>,
}

impl AccountService {
    pub fn new(users: Arc<dyn UserRepository>) -> Self {
        Self { users }
    }

    pub async fn update_profile(
        &self,
        mut user: User,
        request: UpdateMeRequest,
    ) -> AppResult<User> {
        if let Some(full_name) = request.full_name {
            user.full_name = full_name.trim().to_string();
        }
        if let Some(phone) = request.phone {
            user.phone = Some(phone.trim().to_string());
        }
        user.updated_at = Utc::now();
        self.users.update(&user).await?;
        Ok(user)
    }
}
