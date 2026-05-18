use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Mirror of the TS `Entry` type. Template-specific values are kept as raw
/// `serde_json::Value` so the backend can shuttle them without re-validating
/// against the template's field types (the frontend owns that logic).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub template_id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub images: Vec<String>,
    #[serde(default)]
    pub fields: HashMap<String, Value>,
    pub created_at: String,
    pub updated_at: String,
}
