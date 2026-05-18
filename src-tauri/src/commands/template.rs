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
