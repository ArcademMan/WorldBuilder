use serde::{Deserialize, Serialize};

/// On-disk JSON format version. Must mirror `FORMAT_VERSION` in
/// `src/constants/format.ts`.
pub const FORMAT_VERSION: u32 = 1;

/// Mirror of the TS `Project` type — content of `<project>/worldbuilder.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub format_version: u32,
    pub name: String,
    pub created_at: String,
}

/// Mirror of the TS `RecentProject` type — entry in the app-level recents list.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentProject {
    pub path: String,
    pub name: String,
    pub last_opened_at: String,
}
