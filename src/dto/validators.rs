use validator::ValidationError;

pub fn albanian_phone(value: &str) -> Result<(), ValidationError> {
    let digits = value.strip_prefix("+355").ok_or_else(|| invalid("phone"))?;
    let is_valid = (8..=9).contains(&digits.len()) && digits.chars().all(|c| c.is_ascii_digit());
    if is_valid {
        Ok(())
    } else {
        Err(message(
            "phone",
            "must be a valid Albanian phone number in +355 format",
        ))
    }
}

pub fn nipt(value: &str) -> Result<(), ValidationError> {
    let characters: Vec<char> = value.chars().collect();
    let is_valid = characters.len() == 10
        && characters[0].is_ascii_alphabetic()
        && characters[9].is_ascii_alphabetic()
        && characters[1..9].iter().all(|c| c.is_ascii_digit());
    if is_valid {
        Ok(())
    } else {
        Err(message(
            "nipt",
            "must be a valid Albanian NIPT (a letter, 8 digits, then a letter)",
        ))
    }
}

pub fn optional_albanian_phone(value: &str) -> Result<(), ValidationError> {
    albanian_phone(value)
}

fn invalid(code: &'static str) -> ValidationError {
    ValidationError::new(code)
}

fn message(code: &'static str, text: &'static str) -> ValidationError {
    let mut error = ValidationError::new(code);
    error.message = Some(text.into());
    error
}
