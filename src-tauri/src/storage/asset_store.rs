//! Asset storage: file copies live under <project>/assets/images/<id><ext>;
//! metadata (mime, original filename, size, created_at) goes into the
//! `assets` table in project.db. Entries reference assets by id.
//!
//! Read returns raw bytes + mime so the frontend can build an object URL
//! without us having to enable Tauri's asset protocol.

use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::storage::paths::ProjectPaths;
use crate::storage::project_db;
use crate::storage::timestamp::now_iso;

/// Metadata mirror returned to the frontend. The file itself stays on disk;
/// see `read_asset` for the bytes.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub id: String,
    pub mime_type: String,
    pub original_filename: String,
    pub byte_size: i64,
    pub created_at: String,
}

/// Bytes + mime ready to drop into a Blob on the frontend.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetData {
    pub mime_type: String,
    pub bytes: Vec<u8>,
}

/// Copies `source_path` into the project's assets dir, assigning a fresh
/// UUID. The original extension (if any) is preserved on the on-disk file
/// so a user browsing the folder can still recognize image types.
pub fn import_asset(root: &Path, source_path: &Path) -> AppResult<Asset> {
    if !source_path.is_file() {
        return Err(AppError::PathNotFound(source_path.display().to_string()));
    }
    let paths = ProjectPaths::new(root);
    let images_dir = paths.images_dir();
    fs::create_dir_all(&images_dir)?;

    let original_filename = source_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("unnamed")
        .to_string();
    let ext = source_path
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_ascii_lowercase());
    let mime_type = mime_for_extension(ext.as_deref());

    let id = Uuid::new_v4().to_string();
    let stored_name = match ext.as_deref() {
        Some(e) if !e.is_empty() => format!("{id}.{e}"),
        _ => id.clone(),
    };
    let dest = images_dir.join(&stored_name);
    fs::copy(source_path, &dest)?;

    let byte_size = fs::metadata(&dest)?.len() as i64;
    let now = now_iso();

    let conn = project_db::open_or_create(&paths.project_db())?;
    conn.execute(
        "INSERT INTO assets (id, mime_type, original_filename, byte_size, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, mime_type, original_filename, byte_size, now],
    )?;

    Ok(Asset {
        id,
        mime_type,
        original_filename,
        byte_size,
        created_at: now,
    })
}

/// Reads the asset's bytes + mime type. Returns PathNotFound when either
/// the metadata row or the on-disk file is missing.
pub fn read_asset(root: &Path, id: &str) -> AppResult<AssetData> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let row: Option<(String, String)> = conn
        .query_row(
            "SELECT mime_type, original_filename FROM assets WHERE id = ?1",
            params![id],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)),
        )
        .optional()?;
    let Some((mime_type, original_filename)) = row else {
        return Err(AppError::PathNotFound(format!("asset {id}")));
    };
    let file = resolve_asset_file(&paths.images_dir(), id, &original_filename)?;
    let bytes = fs::read(&file)?;
    Ok(AssetData { mime_type, bytes })
}

/// Deletes both the DB row and the on-disk file. Missing-on-disk is
/// tolerated — the row going away is what matters for the UI.
pub fn delete_asset(root: &Path, id: &str) -> AppResult<()> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let original_filename: Option<String> = conn
        .query_row(
            "SELECT original_filename FROM assets WHERE id = ?1",
            params![id],
            |r| r.get::<_, String>(0),
        )
        .optional()?;
    conn.execute("DELETE FROM assets WHERE id = ?1", params![id])?;
    if let Some(name) = original_filename {
        if let Ok(file) = resolve_asset_file(&paths.images_dir(), id, &name) {
            let _ = fs::remove_file(file);
        }
    }
    Ok(())
}

/// Finds the on-disk file for an asset. Tries `<id>.<ext>` first (the
/// modern shape) then bare `<id>` as a fallback.
fn resolve_asset_file(images_dir: &Path, id: &str, original_filename: &str) -> AppResult<PathBuf> {
    let ext = Path::new(original_filename)
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_ascii_lowercase());
    let with_ext = match ext.as_deref() {
        Some(e) if !e.is_empty() => images_dir.join(format!("{id}.{e}")),
        _ => images_dir.join(id),
    };
    if with_ext.is_file() {
        return Ok(with_ext);
    }
    let bare = images_dir.join(id);
    if bare.is_file() {
        return Ok(bare);
    }
    Err(AppError::PathNotFound(with_ext.display().to_string()))
}

/// Best-effort mime mapping. Falls back to `application/octet-stream`;
/// the frontend's <img> will still try to render valid image bytes
/// regardless of the type hint.
fn mime_for_extension(ext: Option<&str>) -> String {
    match ext {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("bmp") => "image/bmp",
        Some("avif") => "image/avif",
        _ => "application/octet-stream",
    }
    .to_string()
}
