use std::sync::Arc;

use axum::extract::{Query, State};
use axum::response::Html;
use serde::Deserialize;

use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct TokenQuery {
    pub token: Option<String>,
}

pub async fn verify_email(
    State(state): State<Arc<AppState>>,
    Query(query): Query<TokenQuery>,
) -> Html<String> {
    let result = match query.token.as_deref() {
        Some(token) if !token.is_empty() => state.auth.verify_email(token).await,
        _ => Err(AppError::bad_request("missing token")),
    };

    match result {
        Ok(()) => Html(result_page(
            "Email-i u verifikua",
            "Adresa juaj e email-it u verifikua me sukses. Tani mund të kyçeni në llogarinë tuaj.",
            true,
        )),
        Err(_) => Html(result_page(
            "Verifikimi dështoi",
            "Ky link verifikimi është i pavlefshëm ose ka skaduar. Ju lutemi kërkoni një email të ri verifikimi nga llogaria juaj.",
            false,
        )),
    }
}

pub async fn reset_password_form() -> Html<&'static str> {
    Html(RESET_PASSWORD_PAGE)
}

fn result_page(title: &str, message: &str, success: bool) -> String {
    let accent = if success { "#0b7a3b" } else { "#b00020" };
    format!(
        "<!doctype html><html lang=\"sq\"><head><meta charset=\"utf-8\">\
         <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\
         <title>{title}</title></head>\
         <body style=\"margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;color:#1f2933;\">\
         <div style=\"max-width:480px;margin:64px auto;background:#fff;border-radius:12px;padding:32px;text-align:center;\">\
         <h1 style=\"color:{accent};font-size:22px;margin:0 0 12px;\">{title}</h1>\
         <p style=\"font-size:15px;line-height:1.6;\">{message}</p>\
         <p style=\"color:#9aa5b1;font-size:12px;margin-top:24px;\">Puna.al</p>\
         </div></body></html>"
    )
}

const RESET_PASSWORD_PAGE: &str = "<!doctype html><html lang=\"sq\"><head><meta charset=\"utf-8\">\
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\
<title>Rivendos fjalëkalimin</title></head>\
<body style=\"margin:0;font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;color:#1f2933;\">\
<div style=\"max-width:420px;margin:64px auto;background:#fff;border-radius:12px;padding:32px;\">\
<h1 style=\"font-size:22px;margin:0 0 16px;\">Rivendos fjalëkalimin</h1>\
<form id=\"form\">\
<input id=\"password\" type=\"password\" placeholder=\"Fjalëkalimi i ri\" minlength=\"8\" required \
style=\"width:100%;box-sizing:border-box;padding:12px;margin-bottom:12px;border:1px solid #cbd2d9;border-radius:8px;font-size:15px;\">\
<input id=\"confirm\" type=\"password\" placeholder=\"Konfirmo fjalëkalimin\" minlength=\"8\" required \
style=\"width:100%;box-sizing:border-box;padding:12px;margin-bottom:16px;border:1px solid #cbd2d9;border-radius:8px;font-size:15px;\">\
<button type=\"submit\" style=\"width:100%;padding:12px;background:#0b5cff;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;\">Ruaj fjalëkalimin</button>\
</form>\
<p id=\"message\" style=\"font-size:14px;line-height:1.6;margin-top:16px;\"></p>\
</div>\
<script>\
const token = new URLSearchParams(location.search).get('token');\
const form = document.getElementById('form');\
const message = document.getElementById('message');\
form.addEventListener('submit', async (event) => {\
  event.preventDefault();\
  const password = document.getElementById('password').value;\
  const confirm = document.getElementById('confirm').value;\
  if (password !== confirm) { message.style.color = '#b00020'; message.textContent = 'Fjalëkalimet nuk përputhen.'; return; }\
  try {\
    const response = await fetch('/api/v1/auth/reset-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) });\
    if (response.ok) { message.style.color = '#0b7a3b'; message.textContent = 'Fjalëkalimi u rivendos me sukses. Tani mund të kyçeni.'; form.style.display = 'none'; }\
    else { const data = await response.json().catch(() => ({})); message.style.color = '#b00020'; message.textContent = data.message || 'Rivendosja dështoi. Linku mund të ketë skaduar.'; }\
  } catch (error) { message.style.color = '#b00020'; message.textContent = 'Ndodhi një gabim. Ju lutemi provoni përsëri.'; }\
});\
</script>\
</body></html>";
