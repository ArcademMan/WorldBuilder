//! Templates that every new project ships with. Inserted at
//! create_project time via the regular template_store API so they are
//! immediately editable by the user.

use std::path::Path;

use crate::domain::field::{FieldDef, FieldType};
use crate::domain::template::Template;
use crate::error::AppResult;
use crate::storage::template_store;

pub const CHARACTER_TEMPLATE_ID: &str = "character";

pub fn seed_starter_templates(root: &Path) -> AppResult<()> {
    template_store::save_template(root, character_template())?;
    Ok(())
}

fn character_template() -> Template {
    Template {
        id: CHARACTER_TEMPLATE_ID.to_string(),
        name: "Character".to_string(),
        parent_id: None,
        icon: Some("👤".to_string()),
        fields: vec![
            plain("aliases", "Aliases", FieldType::StringList, None),
            plain("species", "Species", FieldType::String, None),
            plain("gender", "Gender", FieldType::String, None),
            plain(
                "age",
                "Age",
                FieldType::String,
                Some("Free text — supports values like 'around 30' or 'ancient'."),
            ),
            plain("occupation", "Occupation", FieldType::String, None),
            plain(
                "affiliations",
                "Affiliations",
                FieldType::StringList,
                Some("Plain text for now; will become references when Factions are added."),
            ),
        ],
    }
}

fn plain(key: &str, label: &str, field_type: FieldType, help: Option<&str>) -> FieldDef {
    FieldDef {
        id: None,
        key: key.to_string(),
        label: label.to_string(),
        field_type,
        required: None,
        help_text: help.map(str::to_string),
        ref_template_ids: None,
        vocabulary_id: None,
    }
}
