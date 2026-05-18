//! Entries persisted in project.db across four tables:
//! - `entries`              — one row per entry (scalar columns)
//! - `entry_tags`           — links to the system "tags" vocabulary items
//! - `entry_field_scalars`  — template-specific values that are NOT vocab refs,
//!                            stored as `serde_json::Value` so the shape is
//!                            flexible (strings, numbers, arrays, …)
//! - `entry_vocab_refs`     — template-specific vocab / vocabList values, kept
//!                            as real FK rows so CASCADE auto-purges them
//!                            when an item is deleted.
//!
//! Save is a single transaction: upsert entries row, then replace-all the
//! companion rows for the entry.

use std::collections::HashMap;
use std::path::Path;

use rusqlite::{params, Connection, OptionalExtension};
use serde_json::Value;
use uuid::Uuid;

use crate::domain::entry::Entry;
use crate::domain::field::FieldType;
use crate::error::{AppError, AppResult};
use crate::storage::paths::ProjectPaths;
use crate::storage::project_db;
use crate::storage::timestamp::now_iso;

// --- create / read --------------------------------------------------------

pub fn create_entry(root: &Path, template_id: &str, name: &str) -> AppResult<Entry> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let id = Uuid::new_v4().to_string();
    let now = now_iso();
    conn.execute(
        "INSERT INTO entries (id, template_id, name, summary, body, created_at, updated_at)
         VALUES (?1, ?2, ?3, NULL, '', ?4, ?4)",
        params![id, template_id, name, now],
    )?;
    Ok(Entry {
        id,
        template_id: template_id.to_string(),
        name: name.to_string(),
        summary: None,
        tags: Vec::new(),
        body: String::new(),
        images: Vec::new(),
        fields: HashMap::new(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn list_entries(root: &Path) -> AppResult<Vec<Entry>> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let ids: Vec<String> = {
        let mut stmt = conn.prepare("SELECT id FROM entries ORDER BY name COLLATE NOCASE")?;
        let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
        rows.collect::<Result<_, _>>()?
    };
    let mut out = Vec::with_capacity(ids.len());
    for id in ids {
        if let Some(e) = load_entry(&conn, &id)? {
            out.push(e);
        }
    }
    Ok(out)
}

pub fn read_entry(root: &Path, id: &str) -> AppResult<Entry> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    load_entry(&conn, id)?.ok_or_else(|| AppError::PathNotFound(format!("entry {id}")))
}

fn load_entry(conn: &Connection, id: &str) -> AppResult<Option<Entry>> {
    let mut stmt = conn.prepare(
        "SELECT id, template_id, name, summary, body, created_at, updated_at
         FROM entries WHERE id = ?1",
    )?;
    let opt = stmt
        .query_row(params![id], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, Option<String>>(3)?,
                r.get::<_, String>(4)?,
                r.get::<_, String>(5)?,
                r.get::<_, String>(6)?,
            ))
        })
        .optional()?;
    let Some((eid, template_id, name, summary, body, created_at, updated_at)) = opt else {
        return Ok(None);
    };

    let tags = load_tags(conn, &eid)?;
    let fields = load_fields(conn, &eid, &template_id)?;

    Ok(Some(Entry {
        id: eid,
        template_id,
        name,
        summary,
        tags,
        body,
        images: Vec::new(), // Phase 4
        fields,
        created_at,
        updated_at,
    }))
}

fn load_tags(conn: &Connection, entry_id: &str) -> AppResult<Vec<String>> {
    let mut stmt =
        conn.prepare("SELECT item_id FROM entry_tags WHERE entry_id = ?1 ORDER BY item_id")?;
    let rows = stmt
        .query_map(params![entry_id], |r| r.get::<_, String>(0))?
        .collect::<Result<_, _>>()?;
    Ok(rows)
}

/// Loads template-specific field values. Reads the entry's template to
/// know which keys are vocab/vocabList (so a single ref vs a list can be
/// reconstructed) and which are plain scalars.
fn load_fields(
    conn: &Connection,
    entry_id: &str,
    template_id: &str,
) -> AppResult<HashMap<String, Value>> {
    let mut map: HashMap<String, Value> = HashMap::new();

    // 1) scalars
    let mut s = conn.prepare(
        "SELECT field_key, value_json FROM entry_field_scalars WHERE entry_id = ?1",
    )?;
    for row in s.query_map(params![entry_id], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
    })? {
        let (key, json) = row?;
        let v: Value = serde_json::from_str(&json)?;
        map.insert(key, v);
    }

    // 2) vocab refs — grouped by key, then shaped by the template's FieldType
    let mut refs_by_key: HashMap<String, Vec<String>> = HashMap::new();
    let mut v = conn.prepare(
        "SELECT field_key, item_id FROM entry_vocab_refs
         WHERE entry_id = ?1 ORDER BY field_key, position",
    )?;
    for row in v.query_map(params![entry_id], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
    })? {
        let (key, item_id) = row?;
        refs_by_key.entry(key).or_default().push(item_id);
    }

    let template_field_types = load_template_field_types(conn, template_id)?;
    for (key, items) in refs_by_key {
        let ft = template_field_types.get(&key);
        match ft {
            Some(FieldType::Vocab) => {
                if let Some(first) = items.into_iter().next() {
                    map.insert(key, Value::String(first));
                }
            }
            // Default to list-shape for VocabList or anything unknown
            _ => {
                let arr = items.into_iter().map(Value::String).collect();
                map.insert(key, Value::Array(arr));
            }
        }
    }

    Ok(map)
}

fn load_template_field_types(
    conn: &Connection,
    template_id: &str,
) -> AppResult<HashMap<String, FieldType>> {
    let mut stmt = conn.prepare(
        "SELECT key, field_type FROM template_fields WHERE template_id = ?1",
    )?;
    let mut map = HashMap::new();
    for row in stmt.query_map(params![template_id], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
    })? {
        let (key, t_str) = row?;
        let t = crate::storage::template_store::parse_field_type(&t_str)?;
        map.insert(key, t);
    }
    Ok(map)
}

// --- save -----------------------------------------------------------------

pub fn save_entry(root: &Path, entry: Entry) -> AppResult<Entry> {
    let paths = ProjectPaths::new(root);
    let mut conn = project_db::open_or_create(&paths.project_db())?;
    let now = now_iso();
    let template_field_types = load_template_field_types(&conn, &entry.template_id)?;

    let tx = conn.transaction()?;

    // Upsert the entry row (preserves created_at on update).
    let updated = tx.execute(
        "UPDATE entries SET template_id = ?1, name = ?2, summary = ?3, body = ?4, updated_at = ?5
         WHERE id = ?6",
        params![
            entry.template_id,
            entry.name,
            entry.summary,
            entry.body,
            now,
            entry.id
        ],
    )?;
    if updated == 0 {
        tx.execute(
            "INSERT INTO entries (id, template_id, name, summary, body, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
            params![
                entry.id,
                entry.template_id,
                entry.name,
                entry.summary,
                entry.body,
                now
            ],
        )?;
    }

    // Replace tags.
    tx.execute("DELETE FROM entry_tags WHERE entry_id = ?1", params![entry.id])?;
    for item_id in &entry.tags {
        tx.execute(
            "INSERT OR IGNORE INTO entry_tags (entry_id, item_id) VALUES (?1, ?2)",
            params![entry.id, item_id],
        )?;
    }

    // Replace field values (split scalars vs vocab refs).
    tx.execute(
        "DELETE FROM entry_field_scalars WHERE entry_id = ?1",
        params![entry.id],
    )?;
    tx.execute(
        "DELETE FROM entry_vocab_refs WHERE entry_id = ?1",
        params![entry.id],
    )?;
    for (key, value) in entry.fields.iter() {
        let ft = template_field_types.get(key);
        match (ft, value) {
            (Some(FieldType::Vocab), Value::String(item_id)) => {
                tx.execute(
                    "INSERT INTO entry_vocab_refs (entry_id, field_key, item_id, position)
                     VALUES (?1, ?2, ?3, 0)",
                    params![entry.id, key, item_id],
                )?;
            }
            (Some(FieldType::VocabList), Value::Array(items)) => {
                for (pos, v) in items.iter().enumerate() {
                    if let Value::String(item_id) = v {
                        tx.execute(
                            "INSERT INTO entry_vocab_refs (entry_id, field_key, item_id, position)
                             VALUES (?1, ?2, ?3, ?4)",
                            params![entry.id, key, item_id, pos as i64],
                        )?;
                    }
                }
            }
            // Everything else — including vocab fields with null/wrong shape,
            // and unknown field keys — goes into scalars as JSON.
            _ => {
                let json = serde_json::to_string(value)?;
                tx.execute(
                    "INSERT INTO entry_field_scalars (entry_id, field_key, value_json)
                     VALUES (?1, ?2, ?3)",
                    params![entry.id, key, json],
                )?;
            }
        }
    }

    tx.commit()?;
    drop(conn);
    read_entry(root, &entry.id)
}

pub fn delete_entry(root: &Path, id: &str) -> AppResult<()> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    conn.execute("DELETE FROM entries WHERE id = ?1", params![id])?;
    Ok(())
}
