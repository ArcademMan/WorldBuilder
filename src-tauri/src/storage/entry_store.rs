//! Entry-level CRUD against `<project>/entries/<id>.json`.

use std::fs;
use std::path::Path;

use uuid::Uuid;

use crate::domain::entry::Entry;
use crate::error::{AppError, AppResult};
use crate::storage::json_io;
use crate::storage::paths::ProjectPaths;
use crate::storage::timestamp::now_iso;

/// Creates a brand-new entry of `template_id`, writes it to disk,
/// and returns it. The caller is expected to drive the user back to
/// the editor route for this entry.
pub fn create_entry(project_root: &Path, template_id: &str, name: &str) -> AppResult<Entry> {
    let paths = ProjectPaths::new(project_root);
    let now = now_iso();
    let entry = Entry {
        id: Uuid::new_v4().to_string(),
        template_id: template_id.to_string(),
        name: name.to_string(),
        summary: None,
        tags: Vec::new(),
        body: String::new(),
        images: Vec::new(),
        fields: Default::default(),
        created_at: now.clone(),
        updated_at: now,
    };
    json_io::write_json(&paths.entry_file(&entry.id), &entry)?;
    Ok(entry)
}

pub fn list_entries(project_root: &Path) -> AppResult<Vec<Entry>> {
    let paths = ProjectPaths::new(project_root);
    let dir = paths.entries_dir();
    let mut entries = Vec::new();
    if !dir.exists() {
        return Ok(entries);
    }
    for dirent in fs::read_dir(&dir)? {
        let dirent = dirent?;
        let path = dirent.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        match json_io::read_json::<Entry>(&path) {
            Ok(entry) => entries.push(entry),
            Err(e) => eprintln!("Skipping unreadable entry {}: {}", path.display(), e),
        }
    }
    Ok(entries)
}

pub fn read_entry(project_root: &Path, id: &str) -> AppResult<Entry> {
    let paths = ProjectPaths::new(project_root);
    let file = paths.entry_file(id);
    if !file.exists() {
        return Err(AppError::PathNotFound(file.display().to_string()));
    }
    json_io::read_json(&file)
}

/// Writes `entry`. `created_at` is preserved from the existing file
/// when present; `updated_at` is always refreshed to "now".
pub fn save_entry(project_root: &Path, mut entry: Entry) -> AppResult<Entry> {
    let paths = ProjectPaths::new(project_root);
    let file = paths.entry_file(&entry.id);

    if file.exists() {
        if let Ok(existing) = json_io::read_json::<Entry>(&file) {
            entry.created_at = existing.created_at;
        }
    }
    entry.updated_at = now_iso();

    json_io::write_json(&file, &entry)?;
    Ok(entry)
}

pub fn delete_entry(project_root: &Path, id: &str) -> AppResult<()> {
    let paths = ProjectPaths::new(project_root);
    let file = paths.entry_file(id);
    if file.exists() {
        fs::remove_file(file)?;
    }
    Ok(())
}
