use serde::{Deserialize, Serialize};

use super::field::FieldDef;
use super::layout::LayoutSection;

/// Mirror of the TS `Template` type.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    pub fields: Vec<FieldDef>,
    /// Optional infobox layout. Fields not referenced by any layout
    /// item are rendered after the layout, in declaration order, so
    /// adding a field never makes it disappear.
    #[serde(default)]
    pub layout: Vec<LayoutSection>,
}
