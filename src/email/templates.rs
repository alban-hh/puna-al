use crate::email::EmailMessage;

const PLATFORM_NAME: &str = "Puna.al";

#[derive(Debug, Clone, Copy, Default)]
pub enum Locale {
    #[default]
    Sq,
}

pub fn verification(locale: Locale, to: &str, full_name: &str, verify_url: &str) -> EmailMessage {
    match locale {
        Locale::Sq => EmailMessage {
            to: to.to_string(),
            subject: format!("Verifikoni adresën tuaj të email-it në {PLATFORM_NAME}"),
            html: layout(
                "Mirë se erdhët",
                &format!(
                    "<p>Përshëndetje {name},</p>\
                     <p>Faleminderit që u regjistruat në {platform}. Ju lutemi verifikoni adresën tuaj të email-it duke klikuar butonin më poshtë.</p>\
                     {button}\
                     <p>Nëse butoni nuk funksionon, kopjoni këtë adresë në shfletuesin tuaj:<br><a href=\"{url}\">{url}</a></p>\
                     <p>Nëse nuk e keni krijuar ju këtë llogari, ju lutemi shpërfilleni këtë email.</p>",
                    name = escape_html(full_name),
                    platform = PLATFORM_NAME,
                    button = button("Verifiko email-in", verify_url),
                    url = escape_html(verify_url),
                ),
            ),
        },
    }
}

pub fn password_reset(locale: Locale, to: &str, full_name: &str, reset_url: &str) -> EmailMessage {
    match locale {
        Locale::Sq => EmailMessage {
            to: to.to_string(),
            subject: format!("Rivendosja e fjalëkalimit në {PLATFORM_NAME}"),
            html: layout(
                "Rivendosni fjalëkalimin",
                &format!(
                    "<p>Përshëndetje {name},</p>\
                     <p>Morëm një kërkesë për të rivendosur fjalëkalimin tuaj. Klikoni butonin më poshtë për të vazhduar.</p>\
                     {button}\
                     <p>Ky link skadon së shpejti. Nëse nuk e kërkuat ju këtë ndryshim, shpërfilleni këtë email dhe fjalëkalimi juaj mbetet i pandryshuar.</p>",
                    name = escape_html(full_name),
                    button = button("Rivendos fjalëkalimin", reset_url),
                ),
            ),
        },
    }
}

pub fn business_submitted(
    locale: Locale,
    to: &str,
    full_name: &str,
    business_name: &str,
) -> EmailMessage {
    match locale {
        Locale::Sq => EmailMessage {
            to: to.to_string(),
            subject: format!("Biznesi juaj u dërgua për shqyrtim në {PLATFORM_NAME}"),
            html: layout(
                "Kërkesa u pranua",
                &format!(
                    "<p>Përshëndetje {name},</p>\
                     <p>Biznesi juaj <strong>{business}</strong> u dërgua me sukses dhe është në pritje të shqyrtimit nga ekipi ynë.</p>\
                     <p>Do t'ju njoftojmë me email sapo të miratohet. Pas miratimit do të mund të publikoni shpallje pune.</p>",
                    name = escape_html(full_name),
                    business = escape_html(business_name),
                ),
            ),
        },
    }
}

pub fn business_approved(
    locale: Locale,
    to: &str,
    full_name: &str,
    business_name: &str,
) -> EmailMessage {
    match locale {
        Locale::Sq => EmailMessage {
            to: to.to_string(),
            subject: format!("Biznesi juaj u miratua në {PLATFORM_NAME}"),
            html: layout(
                "Biznesi u miratua",
                &format!(
                    "<p>Përshëndetje {name},</p>\
                     <p>Lajm i mirë! Biznesi juaj <strong>{business}</strong> u miratua.</p>\
                     <p>Tani mund të hyni në llogarinë tuaj dhe të filloni të publikoni shpallje pune.</p>",
                    name = escape_html(full_name),
                    business = escape_html(business_name),
                ),
            ),
        },
    }
}

pub fn business_rejected(
    locale: Locale,
    to: &str,
    full_name: &str,
    business_name: &str,
    reason: &str,
) -> EmailMessage {
    match locale {
        Locale::Sq => EmailMessage {
            to: to.to_string(),
            subject: format!("Biznesi juaj nuk u miratua në {PLATFORM_NAME}"),
            html: layout(
                "Biznesi nuk u miratua",
                &format!(
                    "<p>Përshëndetje {name},</p>\
                     <p>Na vjen keq, por biznesi juaj <strong>{business}</strong> nuk u miratua për momentin.</p>\
                     <p><strong>Arsyeja:</strong> {reason}</p>\
                     <p>Mund të përditësoni të dhënat e biznesit dhe ta dërgoni përsëri për shqyrtim.</p>",
                    name = escape_html(full_name),
                    business = escape_html(business_name),
                    reason = escape_html(reason),
                ),
            ),
        },
    }
}

pub fn application_received(
    locale: Locale,
    to: &str,
    owner_name: &str,
    job_title: &str,
    applicant_name: &str,
) -> EmailMessage {
    match locale {
        Locale::Sq => EmailMessage {
            to: to.to_string(),
            subject: format!("Aplikim i ri për pozicionin \"{job_title}\""),
            html: layout(
                "Aplikim i ri",
                &format!(
                    "<p>Përshëndetje {name},</p>\
                     <p>Keni marrë një aplikim të ri nga <strong>{applicant}</strong> për pozicionin <strong>{job}</strong>.</p>\
                     <p>Hyni në llogarinë tuaj për të parë aplikimin dhe për të përditësuar statusin e tij.</p>",
                    name = escape_html(owner_name),
                    applicant = escape_html(applicant_name),
                    job = escape_html(job_title),
                ),
            ),
        },
    }
}

fn button(label: &str, url: &str) -> String {
    format!(
        "<p style=\"margin:28px 0;\"><a href=\"{url}\" style=\"background:#0b5cff;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600;\">{label}</a></p>",
        url = escape_html(url),
        label = escape_html(label),
    )
}

fn layout(heading: &str, body: &str) -> String {
    format!(
        "<!doctype html><html lang=\"sq\"><body style=\"margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2933;\">\
         <div style=\"max-width:560px;margin:0 auto;padding:24px;\">\
         <div style=\"background:#ffffff;border-radius:12px;padding:32px;\">\
         <h1 style=\"font-size:20px;margin:0 0 16px;\">{heading}</h1>\
         <div style=\"font-size:15px;line-height:1.6;\">{body}</div>\
         </div>\
         <p style=\"text-align:center;color:#9aa5b1;font-size:12px;margin-top:16px;\">© {platform}</p>\
         </div></body></html>",
        heading = escape_html(heading),
        body = body,
        platform = PLATFORM_NAME,
    )
}

fn escape_html(input: &str) -> String {
    let mut output = String::with_capacity(input.len());
    for character in input.chars() {
        match character {
            '&' => output.push_str("&amp;"),
            '<' => output.push_str("&lt;"),
            '>' => output.push_str("&gt;"),
            '"' => output.push_str("&quot;"),
            '\'' => output.push_str("&#39;"),
            other => output.push(other),
        }
    }
    output
}
