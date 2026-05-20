use tauri::AppHandle;

use crate::error::AppResult;
use crate::storage::active_project_store;

#[tauri::command]
pub async fn get_active_project_path(app: AppHandle) -> AppResult<Option<String>> {
    active_project_store::get(&app)
}

#[tauri::command]
pub async fn set_active_project_path(app: AppHandle, path: String) -> AppResult<()> {
    active_project_store::set(&app, &path)
}

#[tauri::command]
pub async fn clear_active_project_path(app: AppHandle) -> AppResult<()> {
    active_project_store::clear(&app)
}
