use std::path::PathBuf;

use crate::domain::entry::Entry;
use crate::error::AppResult;
use crate::storage::entry_store::{self, Backlink};

#[tauri::command]
pub async fn create_entry(
    project_path: String,
    template_id: String,
    name: String,
) -> AppResult<Entry> {
    entry_store::create_entry(&PathBuf::from(project_path), &template_id, &name)
}

#[tauri::command]
pub async fn list_entries(project_path: String) -> AppResult<Vec<Entry>> {
    entry_store::list_entries(&PathBuf::from(project_path))
}

#[tauri::command]
pub async fn read_entry(project_path: String, id: String) -> AppResult<Entry> {
    entry_store::read_entry(&PathBuf::from(project_path), &id)
}

#[tauri::command]
pub async fn save_entry(project_path: String, entry: Entry) -> AppResult<Entry> {
    entry_store::save_entry(&PathBuf::from(project_path), entry)
}

#[tauri::command]
pub async fn delete_entry(project_path: String, id: String) -> AppResult<()> {
    entry_store::delete_entry(&PathBuf::from(project_path), &id)
}

#[tauri::command]
pub async fn list_backlinks(project_path: String, id: String) -> AppResult<Vec<Backlink>> {
    entry_store::list_backlinks(&PathBuf::from(project_path), &id)
}
