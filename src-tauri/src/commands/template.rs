use std::path::PathBuf;

use crate::domain::template::Template;
use crate::error::AppResult;
use crate::storage::template_store;

#[tauri::command]
pub async fn list_templates(project_path: String) -> AppResult<Vec<Template>> {
    template_store::list_templates(&PathBuf::from(project_path))
}

#[tauri::command]
pub async fn read_template(project_path: String, id: String) -> AppResult<Template> {
    template_store::read_template(&PathBuf::from(project_path), &id)
}

/// Upsert. Frontend supplies an `id` (new UUID for fresh templates, existing
/// id when editing). Field `id`s allow rename detection.
#[tauri::command]
pub async fn save_template(project_path: String, template: Template) -> AppResult<Template> {
    template_store::save_template(&PathBuf::from(project_path), template)
}

#[tauri::command]
pub async fn delete_template(project_path: String, id: String) -> AppResult<()> {
    template_store::delete_template(&PathBuf::from(project_path), &id)
}
