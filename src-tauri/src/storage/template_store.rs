//! Template-level read-only access. Templates are written by the
//! starter copier (Phase 1) and, later, by a user-facing template
//! editor (Phase 4).

use std::fs;
use std::path::Path;

use crate::domain::template::Template;
use crate::error::{AppError, AppResult};
use crate::storage::json_io;
use crate::storage::paths::ProjectPaths;

pub fn list_templates(project_root: &Path) -> AppResult<Vec<Template>> {
    let paths = ProjectPaths::new(project_root);
    let dir = paths.templates_dir();
    let mut templates = Vec::new();
    if !dir.exists() {
        return Ok(templates);
    }
    for dirent in fs::read_dir(&dir)? {
        let dirent = dirent?;
        let path = dirent.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        match json_io::read_json::<Template>(&path) {
            Ok(t) => templates.push(t),
            Err(e) => eprintln!("Skipping unreadable template {}: {}", path.display(), e),
        }
    }
    Ok(templates)
}

pub fn read_template(project_root: &Path, id: &str) -> AppResult<Template> {
    let paths = ProjectPaths::new(project_root);
    let file = paths.template_file(id);
    if !file.exists() {
        return Err(AppError::PathNotFound(file.display().to_string()));
    }
    json_io::read_json(&file)
}
