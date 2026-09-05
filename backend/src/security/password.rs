use anyhow::anyhow;
use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;

use crate::error::{AppError, AppResult};

pub fn hash_password(plain: &str) -> AppResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(plain.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| AppError::Internal(anyhow!("password hashing failed: {e}")))
}

pub fn verify_password(plain: &str, stored_hash: &str) -> AppResult<bool> {
    let parsed = PasswordHash::new(stored_hash)
        .map_err(|e| AppError::Internal(anyhow!("stored password hash is invalid: {e}")))?;
    Ok(Argon2::default()
        .verify_password(plain.as_bytes(), &parsed)
        .is_ok())
}
