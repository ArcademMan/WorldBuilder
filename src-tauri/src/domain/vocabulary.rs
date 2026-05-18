use serde::{Deserialize, Serialize};

/// System tags vocabulary id — created in every project at scaffolding
/// (or first open). Mirror of `SYSTEM_TAGS_VOCAB_ID` in
/// `src/types/vocabulary.ts`.
pub const SYSTEM_TAGS_VOCAB_ID: &str = "tags";
pub const SYSTEM_TAGS_VOCAB_NAME: &str = "Tags";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Vocabulary {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VocabularyItem {
    pub id: String,
    pub vocabulary_id: String,
    pub label: String,
    pub created_at: String,
    pub updated_at: String,
}
