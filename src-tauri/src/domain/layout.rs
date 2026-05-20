use serde::{Deserialize, Serialize};

/// How a single field is rendered inside a section column.
/// - `Field`: standard label + input (the default).
/// - `ImageSmall|Medium|Large`: image preview at a preset size; only
///   meaningful when the underlying field is of image type.
/// - `TableRow`: row in a key:value table. Consecutive `TableRow` items
///   inside the same column collapse into a single rendered table.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum LayoutDisplay {
    Field,
    ImageSmall,
    ImageMedium,
    ImageLarge,
    TableRow,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutItem {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub field_key: String,
    pub column_index: i64,
    pub display: LayoutDisplay,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutSection {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    pub columns: i64,
    #[serde(default)]
    pub items: Vec<LayoutItem>,
}

pub fn display_str(d: &LayoutDisplay) -> &'static str {
    match d {
        LayoutDisplay::Field => "field",
        LayoutDisplay::ImageSmall => "image-small",
        LayoutDisplay::ImageMedium => "image-medium",
        LayoutDisplay::ImageLarge => "image-large",
        LayoutDisplay::TableRow => "table-row",
    }
}

pub fn parse_display(s: &str) -> LayoutDisplay {
    match s {
        "image-small" => LayoutDisplay::ImageSmall,
        "image-medium" => LayoutDisplay::ImageMedium,
        "image-large" => LayoutDisplay::ImageLarge,
        "table-row" => LayoutDisplay::TableRow,
        _ => LayoutDisplay::Field,
    }
}
