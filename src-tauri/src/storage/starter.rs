//! Seeds a new project with the templates bundled as Tauri resources.

use std::fs;

use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

use crate::error::AppResult;
use crate::storage::paths::ProjectPaths;

const STARTER_RESOURCE_DIR: &str = "resources/starter-templates";

/// Copies every `.json` file found under the bundled
/// `resources/starter-templates/` folder into the new project's
/// `templates/` directory. Silently no-ops if the resource folder
/// is missing (e.g. when running tests without the build script).
pub fn copy_starter_templates(app: &AppHandle, project: &ProjectPaths) -> AppResult<()> {
    let resource_root = app
        .path()
        .resolve(STARTER_RESOURCE_DIR, BaseDirectory::Resource)?;

    if !resource_root.exists() {
        return Ok(());
    }

    let dest = project.templates_dir();
    fs::create_dir_all(&dest)?;

    for entry in fs::read_dir(&resource_root)? {
        let entry = entry?;
        let src = entry.path();
        let is_json = src.extension().and_then(|e| e.to_str()) == Some("json");
        if !is_json {
            continue;
        }
        if let Some(name) = src.file_name() {
            fs::copy(&src, dest.join(name))?;
        }
    }

    Ok(())
}
