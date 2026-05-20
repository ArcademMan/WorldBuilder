//! Generic "write a text file the user just picked" commands used by
//! the export wizard. Kept in a dedicated module so the storage layer
//! (which is project-scoped) doesn't grow a public escape hatch for
//! writing to arbitrary paths.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::error::{AppError, AppResult};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportFile {
    /// File name (no separators) used inside `dir`.
    pub name: String,
    pub content: String,
}

#[tauri::command]
pub async fn write_text_file(path: String, content: String) -> AppResult<()> {
    let p = PathBuf::from(&path);
    ensure_parent(&p)?;
    fs::write(&p, content)?;
    Ok(())
}

#[tauri::command]
pub async fn write_text_files(dir: String, files: Vec<ExportFile>) -> AppResult<()> {
    let dir_path = PathBuf::from(&dir);
    fs::create_dir_all(&dir_path)?;
    for f in files {
        if f.name.contains(['/', '\\']) || f.name.contains("..") {
            return Err(AppError::Message(format!("invalid file name: {}", f.name)));
        }
        fs::write(dir_path.join(&f.name), &f.content)?;
    }
    Ok(())
}

fn ensure_parent(path: &Path) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)?;
        }
    }
    Ok(())
}
