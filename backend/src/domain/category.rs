use crate::string_enum;

string_enum!(Category {
    InformationTechnology => "information_technology",
    Engineering => "engineering",
    FinanceAccounting => "finance_accounting",
    SalesMarketing => "sales_marketing",
    CustomerService => "customer_service",
    Administration => "administration",
    HumanResources => "human_resources",
    Healthcare => "healthcare",
    Education => "education",
    Construction => "construction",
    Tourism => "tourism",
    Hospitality => "hospitality",
    Retail => "retail",
    Transport => "transport",
    Manufacturing => "manufacturing",
    Agriculture => "agriculture",
    Legal => "legal",
    MediaDesign => "media_design",
    Other => "other",
});

impl Category {
    pub fn label_sq(&self) -> &'static str {
        match self {
            Category::InformationTechnology => "Teknologji Informacioni",
            Category::Engineering => "Inxhinieri",
            Category::FinanceAccounting => "Financë & Kontabilitet",
            Category::SalesMarketing => "Shitje & Marketing",
            Category::CustomerService => "Shërbim Klienti",
            Category::Administration => "Administratë",
            Category::HumanResources => "Burime Njerëzore",
            Category::Healthcare => "Shëndetësi",
            Category::Education => "Arsim",
            Category::Construction => "Ndërtim",
            Category::Tourism => "Turizëm",
            Category::Hospitality => "Hoteleri & Restorante",
            Category::Retail => "Tregti me Pakicë",
            Category::Transport => "Transport & Logjistikë",
            Category::Manufacturing => "Prodhim",
            Category::Agriculture => "Bujqësi",
            Category::Legal => "Juridik",
            Category::MediaDesign => "Media & Dizajn",
            Category::Other => "Tjetër",
        }
    }
}
