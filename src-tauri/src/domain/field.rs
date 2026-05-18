use serde::{Deserialize, Serialize};

/// Mirror of the TS `FieldType` union. Serialized as camelCase strings
/// so the JSON shape matches what the frontend writes.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum FieldType {
    String,
    Text,
    Markdown,
    StringList,
    Number,
    Boolean,
    Date,
    Image,
    ImageList,
    Ref,
    RefList,
    Vocab,
    VocabList,
}

/// Mirror of the TS `FieldDef` type.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldDef {
    /// Stable identifier used to detect renames across saves.
    /// Optional on the wire so the UI can omit it when adding a new field;
    /// the backend generates a UUID in that case.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub key: String,
    pub label: String,
    #[serde(rename = "type")]
    pub field_type: FieldType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub help_text: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ref_template_ids: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub vocabulary_id: Option<String>,
}
