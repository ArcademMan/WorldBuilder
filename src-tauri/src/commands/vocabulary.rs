use std::path::PathBuf;

use crate::domain::vocabulary::{Vocabulary, VocabularyItem};
use crate::error::AppResult;
use crate::storage::vocab_store;

#[tauri::command]
pub async fn list_vocabularies(project_path: String) -> AppResult<Vec<Vocabulary>> {
    vocab_store::list_vocabularies(&PathBuf::from(project_path))
}

#[tauri::command]
pub async fn list_vocabulary_items(
    project_path: String,
    vocabulary_id: String,
) -> AppResult<Vec<VocabularyItem>> {
    vocab_store::list_items(&PathBuf::from(project_path), &vocabulary_id)
}

#[tauri::command]
pub async fn create_vocabulary(
    project_path: String,
    name: String,
) -> AppResult<Vocabulary> {
    vocab_store::create_vocabulary(&PathBuf::from(project_path), &name)
}

#[tauri::command]
pub async fn create_vocabulary_item(
    project_path: String,
    vocabulary_id: String,
    label: String,
) -> AppResult<VocabularyItem> {
    vocab_store::create_item(&PathBuf::from(project_path), &vocabulary_id, &label)
}

#[tauri::command]
pub async fn rename_vocabulary_item(
    project_path: String,
    item_id: String,
    label: String,
) -> AppResult<VocabularyItem> {
    vocab_store::rename_item(&PathBuf::from(project_path), &item_id, &label)
}

#[tauri::command]
pub async fn delete_vocabulary_item(
    project_path: String,
    item_id: String,
) -> AppResult<()> {
    vocab_store::delete_item(&PathBuf::from(project_path), &item_id)
}

#[tauri::command]
pub async fn delete_vocabulary(
    project_path: String,
    vocabulary_id: String,
) -> AppResult<()> {
    vocab_store::delete_vocabulary(&PathBuf::from(project_path), &vocabulary_id)
}
