use std::sync::Arc;

use crate::config::Config;
use crate::repository::UserRepository;
use crate::security::jwt::JwtService;
use crate::service::account::AccountService;
use crate::service::admin::AdminService;
use crate::service::application::ApplicationService;
use crate::service::auth::AuthService;
use crate::service::business::BusinessService;
use crate::service::job::JobService;

pub struct AppState {
    pub config: Arc<Config>,
    pub jwt: Arc<JwtService>,
    pub users: Arc<dyn UserRepository>,
    pub auth: AuthService,
    pub account: AccountService,
    pub business: BusinessService,
    pub job: JobService,
    pub application: ApplicationService,
    pub admin: AdminService,
}
