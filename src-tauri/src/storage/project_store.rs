//! Project lifecycle: create_project (init DB + seed) and open_project
//! (validate DB + read metadata). Everything lives inside project.db —
//! there is no JSON marker on disk.

use std::fs;
use std::path::Path;

use rusqlite::{params, OptionalExtension};
use tauri::AppHandle;

use crate::domain::project::{Project, FORMAT_VERSION};
use crate::error::{AppError, AppResult};
use crate::storage::paths::ProjectPaths;
use crate::storage::project_db;
use crate::storage::starter_templates;
use crate::storage::timestamp::now_iso;

/// Initializes a brand-new project in `root`. The folder may exist but
/// must not already contain a `project.db`. Creates the SQLite database,
/// seeds the system vocabularies and the starter templates.
///
/// `app` is unused for now — kept in the signature for symmetry with the
/// previous bundle-resource-based implementation and because future
/// asset-related work will need it.
pub fn create_project(_app: &AppHandle, root: &Path, name: &str) -> AppResult<Project> {
    fs::create_dir_all(root)?;

    let paths = ProjectPaths::new(root);
    if paths.project_db().exists() {
        return Err(AppError::FolderNotEmpty(root.display().to_string()));
    }

    fs::create_dir_all(paths.images_dir())?;

    let now = now_iso();
    {
        let conn = project_db::open_or_create(&paths.project_db())?;
        conn.execute(
            "INSERT INTO project_meta (id, name, format_version, created_at)
             VALUES (1, ?1, ?2, ?3)",
            params![name, FORMAT_VERSION, now],
        )?;
        project_db::seed_system_vocabularies(&conn)?;
    }

    starter_templates::seed_starter_content(root)?;

    Ok(Project {
        format_version: FORMAT_VERSION,
        name: name.to_string(),
        created_at: now,
    })
}

/// Reads project metadata from `project.db`. Errors if the folder isn't
/// a WorldBuilder project or its format version is newer than supported.
pub fn open_project(root: &Path) -> AppResult<Project> {
    if !root.exists() {
        return Err(AppError::PathNotFound(root.display().to_string()));
    }

    let paths = ProjectPaths::new(root);
    if !paths.project_db().exists() {
        return Err(AppError::NotAProject(root.display().to_string()));
    }

    let conn = project_db::open_or_create(&paths.project_db())?;

    let mut stmt = conn.prepare(
        "SELECT name, format_version, created_at FROM project_meta WHERE id = 1",
    )?;
    let opt = stmt
        .query_row([], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, u32>(1)?,
                r.get::<_, String>(2)?,
            ))
        })
        .optional()?;

    let (name, format_version, created_at) = opt
        .ok_or_else(|| AppError::NotAProject(root.display().to_string()))?;

    if format_version > FORMAT_VERSION {
        return Err(AppError::UnsupportedFormat {
            found: format_version,
            supported: FORMAT_VERSION,
        });
    }

    Ok(Project {
        format_version,
        name,
        created_at,
    })
}
