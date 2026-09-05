use crate::string_enum;

string_enum!(Role {
    User => "user",
    Admin => "admin",
});

impl Role {
    pub fn is_admin(&self) -> bool {
        matches!(self, Role::Admin)
    }
}
