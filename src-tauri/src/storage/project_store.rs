//! Project-level CRUD: creating a fresh project folder, opening an
//! existing one. Higher-level than `json_io`; orchestrates filesystem
//! layout + starter content.

use std::fs;
use std::path::Path;

use tauri::AppHandle;
use time::format_description::well_known::Iso8601;
use time::OffsetDateTime;

use crate::domain::project::{Project, FORMAT_VERSION};
use crate::error::{AppError, AppResult};
use crate::storage::json_io;
use crate::storage::paths::ProjectPaths;
use crate::storage::starter;

/// Creates the folder structure for a brand-new project at `root`.
/// Fails if `root` already contains a `worldbuilder.json` (to avoid
/// silently overwriting an existing project). Other files in `root`
/// are tolerated so the user can pick an empty-but-pre-created folder.
pub fn create_project(app: &AppHandle, root: &Path, name: &str) -> AppResult<Project> {
    fs::create_dir_all(root)?;

    let paths = ProjectPaths::new(root);
    if paths.manifest().exists() {
        return Err(AppError::FolderNotEmpty(root.display().to_string()));
    }

    fs::create_dir_all(paths.templates_dir())?;
    fs::create_dir_all(paths.entries_dir())?;
    fs::create_dir_all(paths.images_dir())?;

    let project = Project {
        format_version: FORMAT_VERSION,
        name: name.to_string(),
        created_at: now_iso(),
    };

    json_io::write_json(&paths.manifest(), &project)?;
    starter::copy_starter_templates(app, &paths)?;

    Ok(project)
}

/// Reads and validates the manifest of an existing project.
pub fn open_project(root: &Path) -> AppResult<Project> {
    if !root.exists() {
        return Err(AppError::PathNotFound(root.display().to_string()));
    }

    let paths = ProjectPaths::new(root);
    let manifest = paths.manifest();
    if !manifest.exists() {
        return Err(AppError::NotAProject(root.display().to_string()));
    }

    let project: Project = json_io::read_json(&manifest)?;
    if project.format_version > FORMAT_VERSION {
        return Err(AppError::UnsupportedFormat {
            found: project.format_version,
            supported: FORMAT_VERSION,
        });
    }
    Ok(project)
}

pub fn now_iso() -> String {
    OffsetDateTime::now_utc()
        .format(&Iso8601::DEFAULT)
        .unwrap_or_else(|_| String::from("1970-01-01T00:00:00.000000000Z"))
}
