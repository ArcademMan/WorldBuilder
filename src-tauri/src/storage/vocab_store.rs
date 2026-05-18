//! High-level CRUD over the project's vocabularies DB plus the
//! "purge entries" cleanup that runs when an item or vocabulary is
//! deleted.

use std::collections::HashSet;
use std::path::Path;

use rusqlite::{params, Row};
use uuid::Uuid;

use crate::domain::vocabulary::{Vocabulary, VocabularyItem, SYSTEM_TAGS_VOCAB_ID};
use crate::error::{AppError, AppResult};
use crate::storage::entry_store;
use crate::storage::paths::ProjectPaths;
use crate::storage::timestamp::now_iso;
use crate::storage::vocab_db;

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
    let conn = vocab_db::open_or_create(&paths.vocab_db())?;
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
    let conn = vocab_db::open_or_create(&paths.vocab_db())?;
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
    let conn = vocab_db::open_or_create(&paths.vocab_db())?;
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
    let conn = vocab_db::open_or_create(&paths.vocab_db())?;
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
    let conn = vocab_db::open_or_create(&paths.vocab_db())?;
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

// --- delete with cascade purge -------------------------------------------

pub fn delete_item(root: &Path, item_id: &str) -> AppResult<()> {
    let paths = ProjectPaths::new(root);
    {
        let conn = vocab_db::open_or_create(&paths.vocab_db())?;
        conn.execute(
            "DELETE FROM vocabulary_items WHERE id = ?1",
            params![item_id],
        )?;
    }
    purge_entries_for_items(root, &[item_id.to_string()])?;
    Ok(())
}

pub fn delete_vocabulary(root: &Path, vocabulary_id: &str) -> AppResult<()> {
    if vocabulary_id == SYSTEM_TAGS_VOCAB_ID {
        return Err(AppError::Message(
            "Cannot delete the system 'tags' vocabulary".into(),
        ));
    }
    let paths = ProjectPaths::new(root);
    let item_ids: Vec<String> = {
        let conn = vocab_db::open_or_create(&paths.vocab_db())?;
        let mut stmt =
            conn.prepare("SELECT id FROM vocabulary_items WHERE vocabulary_id = ?1")?;
        let rows = stmt
            .query_map(params![vocabulary_id], |r| r.get::<_, String>(0))?
            .collect::<Result<Vec<_>, _>>()?;
        // ON DELETE CASCADE wipes the items row-side; we keep the ids so
        // we can strip them from entries on disk.
        conn.execute(
            "DELETE FROM vocabularies WHERE id = ?1",
            params![vocabulary_id],
        )?;
        rows
    };
    purge_entries_for_items(root, &item_ids)?;
    Ok(())
}

/// Strips the given item ids from every entry's tags and field values.
/// Touched entries get re-saved (which refreshes their `updated_at`).
fn purge_entries_for_items(root: &Path, item_ids: &[String]) -> AppResult<()> {
    if item_ids.is_empty() {
        return Ok(());
    }
    let set: HashSet<&str> = item_ids.iter().map(String::as_str).collect();
    let entries = entry_store::list_entries(root)?;

    for mut entry in entries {
        let mut touched = false;

        let before = entry.tags.len();
        entry.tags.retain(|t| !set.contains(t.as_str()));
        if entry.tags.len() != before {
            touched = true;
        }

        let mut to_remove: Vec<String> = Vec::new();
        for (key, value) in entry.fields.iter_mut() {
            match value {
                serde_json::Value::String(s) => {
                    if set.contains(s.as_str()) {
                        to_remove.push(key.clone());
                        touched = true;
                    }
                }
                serde_json::Value::Array(arr) => {
                    let original = arr.len();
                    arr.retain(|v| match v {
                        serde_json::Value::String(s) => !set.contains(s.as_str()),
                        _ => true,
                    });
                    if arr.len() != original {
                        touched = true;
                        if arr.is_empty() {
                            to_remove.push(key.clone());
                        }
                    }
                }
                _ => {}
            }
        }
        for key in to_remove {
            entry.fields.remove(&key);
        }

        if touched {
            entry_store::save_entry(root, entry)?;
        }
    }
    Ok(())
}
