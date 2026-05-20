//! Templates and vocabularies that every new project ships with.
//! Inserted at create_project time so they are immediately editable
//! by the user from the UI.
//!
//! Template IDs and seed-vocabulary IDs are stable strings so cross-
//! references (ref_template_ids, vocabulary_id) can be wired up at
//! seed time without runtime lookups.

use std::path::Path;

use rusqlite::params;
use uuid::Uuid;

use crate::domain::field::{FieldDef, FieldType};
use crate::domain::template::Template;
use crate::error::AppResult;
use crate::storage::paths::ProjectPaths;
use crate::storage::project_db;
use crate::storage::template_store;
use crate::storage::timestamp::now_iso;

// --- stable template ids --------------------------------------------------

pub const CHARACTER_TEMPLATE_ID: &str = "character";
pub const FACTION_TEMPLATE_ID: &str = "faction";
pub const LOCATION_TEMPLATE_ID: &str = "location";
pub const SPECIES_TEMPLATE_ID: &str = "species";
pub const ABILITY_TEMPLATE_ID: &str = "ability";
pub const ITEM_TEMPLATE_ID: &str = "item";
pub const EVENT_TEMPLATE_ID: &str = "event";

// --- stable vocabulary ids ------------------------------------------------

pub const STATUS_VOCAB_ID: &str = "status";
pub const CLASSIFICATION_VOCAB_ID: &str = "character_classification";
pub const FACTION_TYPE_VOCAB_ID: &str = "faction_type";
pub const LOCATION_TYPE_VOCAB_ID: &str = "location_type";
pub const ABILITY_TYPE_VOCAB_ID: &str = "ability_type";
pub const ITEM_TYPE_VOCAB_ID: &str = "item_type";
pub const POWER_LEVEL_VOCAB_ID: &str = "power_level";

// --- entry point ----------------------------------------------------------

pub fn seed_starter_content(root: &Path) -> AppResult<()> {
    seed_starter_vocabularies(root)?;
    seed_starter_templates(root)?;
    Ok(())
}

fn seed_starter_templates(root: &Path) -> AppResult<()> {
    template_store::save_template(root, character_template())?;
    template_store::save_template(root, faction_template())?;
    template_store::save_template(root, location_template())?;
    template_store::save_template(root, species_template())?;
    template_store::save_template(root, ability_template())?;
    template_store::save_template(root, item_template())?;
    template_store::save_template(root, event_template())?;
    Ok(())
}

fn seed_starter_vocabularies(root: &Path) -> AppResult<()> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let now = now_iso();

    let vocabs: &[(&str, &str, &[&str])] = &[
        (
            STATUS_VOCAB_ID,
            "Status",
            &["Alive", "Deceased", "Missing", "Unknown", "Inactive"],
        ),
        (
            CLASSIFICATION_VOCAB_ID,
            "Character Classification",
            &[
                "Protagonist",
                "Antagonist",
                "Supporting",
                "Minor",
                "Background",
            ],
        ),
        (
            FACTION_TYPE_VOCAB_ID,
            "Faction Type",
            &[
                "Guild",
                "Government",
                "Cult",
                "Army",
                "Corporation",
                "Order",
                "Tribe",
                "Clan",
            ],
        ),
        (
            LOCATION_TYPE_VOCAB_ID,
            "Location Type",
            &[
                "Continent",
                "Country",
                "Region",
                "City",
                "Town",
                "Village",
                "Building",
                "Realm",
                "Planet",
            ],
        ),
        (
            ABILITY_TYPE_VOCAB_ID,
            "Ability Type",
            &[
                "Magic",
                "Martial",
                "Innate",
                "Technological",
                "Psychic",
                "Divine",
            ],
        ),
        (
            ITEM_TYPE_VOCAB_ID,
            "Item Type",
            &[
                "Weapon",
                "Armor",
                "Artifact",
                "Consumable",
                "Tool",
                "Document",
            ],
        ),
        (
            POWER_LEVEL_VOCAB_ID,
            "Power Level",
            &[
                "Tier 11 — Infinitesimal",
                "Tier 10 — Athletic Human / Street level",
                "Tier 9 — Wall level",
                "Tier 8 — Building level",
                "Tier 7 — City level",
                "Tier 6 — Continent / Moon level",
                "Tier 5 — Planet / Star level",
                "Tier 4 — Solar System level",
                "Tier 3 — Galaxy / Universe level",
                "Tier 2 — Multiverse level",
                "Tier 1 — Outerversal / Hyperversal",
                "Tier 0 — Boundless / Omnipotent",
            ],
        ),
    ];

    for (id, name, items) in vocabs {
        conn.execute(
            "INSERT OR IGNORE INTO vocabularies (id, name, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?3)",
            params![id, name, now],
        )?;
        for label in *items {
            conn.execute(
                "INSERT OR IGNORE INTO vocabulary_items
                   (id, vocabulary_id, label, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?4)",
                params![Uuid::new_v4().to_string(), id, label, now],
            )?;
        }
    }

    Ok(())
}

// --- templates ------------------------------------------------------------

fn character_template() -> Template {
    Template {
        id: CHARACTER_TEMPLATE_ID.to_string(),
        name: "Character".to_string(),
        parent_id: None,
        icon: Some("lucide:User".to_string()),
        fields: vec![
            image("image", "Image"),
            plain("aliases", "Aliases", FieldType::StringList, None),
            vocab("status", "Status", STATUS_VOCAB_ID),
            plain(
                "age",
                "Age",
                FieldType::String,
                Some("Free text — supports values like 'around 30' or 'ancient'."),
            ),
            plain("gender", "Gender", FieldType::String, None),
            plain("height", "Height", FieldType::String, None),
            vocab(
                "classification",
                "Classification",
                CLASSIFICATION_VOCAB_ID,
            ),
            reference("species", "Species", &[SPECIES_TEMPLATE_ID]),
            ref_list("affiliations", "Affiliations", &[FACTION_TEMPLATE_ID]),
            ref_list("abilities", "Abilities", &[ABILITY_TEMPLATE_ID]),
            vocab("power_level", "Power Level", POWER_LEVEL_VOCAB_ID),
            reference("origin", "Origin", &[LOCATION_TEMPLATE_ID]),
        ],
        layout: Vec::new(),
    }
}

fn faction_template() -> Template {
    Template {
        id: FACTION_TEMPLATE_ID.to_string(),
        name: "Faction".to_string(),
        parent_id: None,
        icon: Some("lucide:Swords".to_string()),
        fields: vec![
            image("image", "Image"),
            plain("aliases", "Aliases", FieldType::StringList, None),
            vocab("type", "Type", FACTION_TYPE_VOCAB_ID),
            reference("leader", "Leader", &[CHARACTER_TEMPLATE_ID]),
            ref_list("members", "Members", &[CHARACTER_TEMPLATE_ID]),
            reference("headquarters", "Headquarters", &[LOCATION_TEMPLATE_ID]),
            ref_list("allies", "Allies", &[FACTION_TEMPLATE_ID]),
            ref_list("enemies", "Enemies", &[FACTION_TEMPLATE_ID]),
        ],
        layout: Vec::new(),
    }
}

fn location_template() -> Template {
    Template {
        id: LOCATION_TEMPLATE_ID.to_string(),
        name: "Location".to_string(),
        parent_id: None,
        icon: Some("lucide:MapPin".to_string()),
        fields: vec![
            image("image", "Image"),
            plain("aliases", "Aliases", FieldType::StringList, None),
            vocab("type", "Type", LOCATION_TYPE_VOCAB_ID),
            reference(
                "parent_location",
                "Parent Location",
                &[LOCATION_TEMPLATE_ID],
            ),
            reference("controlled_by", "Controlled By", &[FACTION_TEMPLATE_ID]),
        ],
        layout: Vec::new(),
    }
}

fn species_template() -> Template {
    Template {
        id: SPECIES_TEMPLATE_ID.to_string(),
        name: "Species".to_string(),
        parent_id: None,
        icon: Some("lucide:Rabbit".to_string()),
        fields: vec![
            image("image", "Image"),
            plain("aliases", "Aliases", FieldType::StringList, None),
            reference("homeworld", "Homeworld", &[LOCATION_TEMPLATE_ID]),
            ref_list(
                "typical_abilities",
                "Typical Abilities",
                &[ABILITY_TEMPLATE_ID],
            ),
            plain("traits", "Traits", FieldType::StringList, None),
        ],
        layout: Vec::new(),
    }
}

fn ability_template() -> Template {
    Template {
        id: ABILITY_TEMPLATE_ID.to_string(),
        name: "Ability".to_string(),
        parent_id: None,
        icon: Some("lucide:Sparkles".to_string()),
        fields: vec![
            image("image", "Image"),
            plain("aliases", "Aliases", FieldType::StringList, None),
            vocab("type", "Type", ABILITY_TYPE_VOCAB_ID),
            vocab("power_level", "Power Level", POWER_LEVEL_VOCAB_ID),
            plain("description", "Description", FieldType::Markdown, None),
        ],
        layout: Vec::new(),
    }
}

fn item_template() -> Template {
    Template {
        id: ITEM_TEMPLATE_ID.to_string(),
        name: "Item".to_string(),
        parent_id: None,
        icon: Some("lucide:Package".to_string()),
        fields: vec![
            image("image", "Image"),
            plain("aliases", "Aliases", FieldType::StringList, None),
            vocab("type", "Type", ITEM_TYPE_VOCAB_ID),
            reference("owner", "Owner", &[CHARACTER_TEMPLATE_ID]),
            reference("origin", "Origin", &[LOCATION_TEMPLATE_ID]),
        ],
        layout: Vec::new(),
    }
}

fn event_template() -> Template {
    Template {
        id: EVENT_TEMPLATE_ID.to_string(),
        name: "Event".to_string(),
        parent_id: None,
        icon: Some("lucide:Scroll".to_string()),
        fields: vec![
            plain("aliases", "Aliases", FieldType::StringList, None),
            plain(
                "date",
                "Date",
                FieldType::String,
                Some("Free text — in-world dates rarely fit a calendar picker."),
            ),
            reference("location", "Location", &[LOCATION_TEMPLATE_ID]),
            ref_list("participants", "Participants", &[CHARACTER_TEMPLATE_ID]),
            ref_list(
                "factions_involved",
                "Factions Involved",
                &[FACTION_TEMPLATE_ID],
            ),
        ],
        layout: Vec::new(),
    }
}

// --- field constructors ---------------------------------------------------

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

fn image(key: &str, label: &str) -> FieldDef {
    plain(key, label, FieldType::Image, None)
}

fn vocab(key: &str, label: &str, vocabulary_id: &str) -> FieldDef {
    FieldDef {
        id: None,
        key: key.to_string(),
        label: label.to_string(),
        field_type: FieldType::Vocab,
        required: None,
        help_text: None,
        ref_template_ids: None,
        vocabulary_id: Some(vocabulary_id.to_string()),
    }
}

fn reference(key: &str, label: &str, template_ids: &[&str]) -> FieldDef {
    FieldDef {
        id: None,
        key: key.to_string(),
        label: label.to_string(),
        field_type: FieldType::Ref,
        required: None,
        help_text: None,
        ref_template_ids: Some(template_ids.iter().map(|s| s.to_string()).collect()),
        vocabulary_id: None,
    }
}

fn ref_list(key: &str, label: &str, template_ids: &[&str]) -> FieldDef {
    FieldDef {
        id: None,
        key: key.to_string(),
        label: label.to_string(),
        field_type: FieldType::RefList,
        required: None,
        help_text: None,
        ref_template_ids: Some(template_ids.iter().map(|s| s.to_string()).collect()),
        vocabulary_id: None,
    }
}
