use std::path::PathBuf;

use crate::error::AppResult;
use crate::storage::asset_store::{self, Asset, AssetData};

#[tauri::command]
pub async fn import_asset(project_path: String, source_path: String) -> AppResult<Asset> {
    asset_store::import_asset(&PathBuf::from(project_path), &PathBuf::from(source_path))
}

#[tauri::command]
pub async fn read_asset(project_path: String, id: String) -> AppResult<AssetData> {
    asset_store::read_asset(&PathBuf::from(project_path), &id)
}

#[tauri::command]
pub async fn delete_asset(project_path: String, id: String) -> AppResult<()> {
    asset_store::delete_asset(&PathBuf::from(project_path), &id)
}
