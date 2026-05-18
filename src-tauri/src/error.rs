//! Application-wide error type. All commands return `AppResult<T>`,
//! which serializes the error message as a plain string when crossing
//! the Tauri bridge — keeping the frontend contract simple.

use serde::{Serialize, Serializer};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("Store error: {0}")]
    Store(#[from] tauri_plugin_store::Error),

    #[error("Database error: {0}")]
    Db(#[from] rusqlite::Error),

    #[error("Path does not exist: {0}")]
    PathNotFound(String),

    #[error("Not a WorldBuilder project: {0}")]
    NotAProject(String),

    #[error("Project format version {found} is newer than supported {supported}")]
    UnsupportedFormat { found: u32, supported: u32 },

    #[error("Target folder is not empty: {0}")]
    FolderNotEmpty(String),

    #[error("{0}")]
    Message(String),
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
