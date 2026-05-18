use std::path::PathBuf;

use tauri::AppHandle;

use crate::domain::project::Project;
use crate::error::AppResult;
use crate::storage::project_store;

#[tauri::command]
pub async fn create_project(
    app: AppHandle,
    path: String,
    name: String,
) -> AppResult<Project> {
    project_store::create_project(&app, &PathBuf::from(path), &name)
}

#[tauri::command]
pub async fn open_project(path: String) -> AppResult<Project> {
    project_store::open_project(&PathBuf::from(path))
}
