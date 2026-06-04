use crate::domain::application::Application;

#[derive(Debug, Clone)]
pub struct ApplicantApplication {
    pub application: Application,
    pub job_title: String,
    pub job_city: String,
    pub business_name: String,
}

#[derive(Debug, Clone)]
pub struct JobApplication {
    pub application: Application,
    pub applicant_full_name: String,
    pub applicant_email: String,
    pub applicant_phone: Option<String>,
}
