use tauri::AppHandle;

use crate::domain::project::RecentProject;
use crate::error::AppResult;
use crate::storage::recents_store;

#[tauri::command]
pub async fn list_recent_projects(app: AppHandle) -> AppResult<Vec<RecentProject>> {
    recents_store::list(&app)
}

#[tauri::command]
pub async fn add_recent_project(
    app: AppHandle,
    recent: RecentProject,
) -> AppResult<Vec<RecentProject>> {
    recents_store::add(&app, recent)
}

#[tauri::command]
pub async fn remove_recent_project(
    app: AppHandle,
    path: String,
) -> AppResult<Vec<RecentProject>> {
    recents_store::remove(&app, &path)
}
