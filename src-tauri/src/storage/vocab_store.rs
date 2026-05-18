//! High-level CRUD over the vocabularies tables in project.db.
//! Item-level CASCADE on `entry_tags` and `entry_vocab_refs` means
//! deleting a vocabulary or an item auto-purges every entry that
//! referenced it — no Rust-side scan needed anymore.

use std::path::Path;

use rusqlite::{params, Row};
use uuid::Uuid;

use crate::domain::vocabulary::{Vocabulary, VocabularyItem, SYSTEM_TAGS_VOCAB_ID};
use crate::error::{AppError, AppResult};
use crate::storage::paths::ProjectPaths;
use crate::storage::project_db;
use crate::storage::timestamp::now_iso;

// --- row mappers ----------------------------------------------------------

fn map_vocab(row: &Row) -> rusqlite::Result<Vocabulary> {
    Ok(Vocabulary {
        id: row.get("id")?,
        name: row.get("name")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_item(row: &Row) -> rusqlite::Result<VocabularyItem> {
    Ok(VocabularyItem {
        id: row.get("id")?,
        vocabulary_id: row.get("vocabulary_id")?,
        label: row.get("label")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

// --- read -----------------------------------------------------------------

pub fn list_vocabularies(root: &Path) -> AppResult<Vec<Vocabulary>> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let mut stmt = conn.prepare(
        "SELECT id, name, created_at, updated_at FROM vocabularies ORDER BY name",
    )?;
    let rows = stmt
        .query_map([], map_vocab)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn list_items(root: &Path, vocabulary_id: &str) -> AppResult<Vec<VocabularyItem>> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let mut stmt = conn.prepare(
        "SELECT id, vocabulary_id, label, created_at, updated_at
         FROM vocabulary_items
         WHERE vocabulary_id = ?1
         ORDER BY label COLLATE NOCASE",
    )?;
    let rows = stmt
        .query_map(params![vocabulary_id], map_item)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

// --- create / update ------------------------------------------------------

pub fn create_vocabulary(root: &Path, name: &str) -> AppResult<Vocabulary> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    conn.execute(
        "INSERT INTO vocabularies (id, name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?3)",
        params![id, name, now],
    )?;
    Ok(Vocabulary {
        id,
        name: name.to_string(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn create_item(
    root: &Path,
    vocabulary_id: &str,
    label: &str,
) -> AppResult<VocabularyItem> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    conn.execute(
        "INSERT INTO vocabulary_items (id, vocabulary_id, label, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)",
        params![id, vocabulary_id, label, now],
    )?;
    Ok(VocabularyItem {
        id,
        vocabulary_id: vocabulary_id.to_string(),
        label: label.to_string(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn rename_item(
    root: &Path,
    item_id: &str,
    new_label: &str,
) -> AppResult<VocabularyItem> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let now = now_iso();
    conn.execute(
        "UPDATE vocabulary_items SET label = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_label, now, item_id],
    )?;
    let mut stmt = conn.prepare(
        "SELECT id, vocabulary_id, label, created_at, updated_at
         FROM vocabulary_items WHERE id = ?1",
    )?;
    let item = stmt.query_row(params![item_id], map_item)?;
    Ok(item)
}

// --- delete (FK CASCADE handles entries cleanup) --------------------------

pub fn delete_item(root: &Path, item_id: &str) -> AppResult<()> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    conn.execute(
        "DELETE FROM vocabulary_items WHERE id = ?1",
        params![item_id],
    )?;
    Ok(())
}

pub fn delete_vocabulary(root: &Path, vocabulary_id: &str) -> AppResult<()> {
    if vocabulary_id == SYSTEM_TAGS_VOCAB_ID {
        return Err(AppError::Message(
            "Cannot delete the system 'tags' vocabulary".into(),
        ));
    }
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    conn.execute(
        "DELETE FROM vocabularies WHERE id = ?1",
        params![vocabulary_id],
    )?;
    Ok(())
}
