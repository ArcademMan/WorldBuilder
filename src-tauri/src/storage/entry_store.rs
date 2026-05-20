//! Entries persisted in project.db across five tables:
//! - `entries`              — one row per entry (scalar columns)
//! - `entry_tags`           — links to the system "tags" vocabulary items
//! - `entry_field_scalars`  — template-specific values that are NOT refs,
//!                            stored as `serde_json::Value` so the shape is
//!                            flexible (strings, numbers, arrays, …)
//! - `entry_vocab_refs`     — vocab / vocabList values, kept as real FK rows
//!                            so CASCADE auto-purges them when an item is
//!                            deleted.
//! - `entry_entry_refs`     — ref / refList values (entry-to-entry links),
//!                            CASCADE on both endpoints. Doubles as the
//!                            backlink index.
//!
//! Save is a single transaction: upsert entries row, then replace-all the
//! companion rows for the entry.

use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::sync::OnceLock;

use regex::Regex;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

/// Field key used to store wikilink-derived backlinks discovered in an
/// entry's body. Kept distinct from any template field key so the two
/// origins remain identifiable in the backlinks panel.
const BODY_REF_FIELD_KEY: &str = "body";

use crate::domain::entry::Entry;
use crate::domain::field::FieldType;
use crate::error::{AppError, AppResult};
use crate::storage::paths::ProjectPaths;
use crate::storage::project_db;
use crate::storage::timestamp::now_iso;

/// One incoming reference to an entry: another entry's id + which of its
/// fields holds the link. The UI resolves the source entry / template
/// against the in-memory lists to render names and field labels.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Backlink {
    pub source_entry_id: String,
    pub source_template_id: String,
    pub source_name: String,
    pub field_key: String,
}

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

    let template_field_types = load_template_field_types(conn, template_id)?;

    // 2) vocab refs — grouped by key, then shaped by the template's FieldType
    let mut vocab_by_key: HashMap<String, Vec<String>> = HashMap::new();
    let mut v = conn.prepare(
        "SELECT field_key, item_id FROM entry_vocab_refs
         WHERE entry_id = ?1 ORDER BY field_key, position",
    )?;
    for row in v.query_map(params![entry_id], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
    })? {
        let (key, item_id) = row?;
        vocab_by_key.entry(key).or_default().push(item_id);
    }
    insert_refs_shaped(&mut map, &template_field_types, vocab_by_key, FieldType::Vocab);

    // 3) entry-to-entry refs — same shape logic, keyed by Ref vs RefList
    let mut entry_refs_by_key: HashMap<String, Vec<String>> = HashMap::new();
    let mut e = conn.prepare(
        "SELECT field_key, target_id FROM entry_entry_refs
         WHERE entry_id = ?1 ORDER BY field_key, position",
    )?;
    for row in e.query_map(params![entry_id], |r| {
        Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
    })? {
        let (key, target_id) = row?;
        entry_refs_by_key.entry(key).or_default().push(target_id);
    }
    insert_refs_shaped(&mut map, &template_field_types, entry_refs_by_key, FieldType::Ref);

    Ok(map)
}

/// Shapes the multi-row representation of a ref-like field back into a single
/// JSON value: scalar string when the template says it's the singular variant,
/// array of strings otherwise. `singular_marker` selects the singular variant
/// (Vocab vs Ref) — anything else is treated as a list.
fn insert_refs_shaped(
    map: &mut HashMap<String, Value>,
    types: &HashMap<String, FieldType>,
    refs: HashMap<String, Vec<String>>,
    singular_marker: FieldType,
) {
    for (key, items) in refs {
        let is_singular = types.get(&key) == Some(&singular_marker);
        if is_singular {
            if let Some(first) = items.into_iter().next() {
                map.insert(key, Value::String(first));
            }
        } else {
            let arr = items.into_iter().map(Value::String).collect();
            map.insert(key, Value::Array(arr));
        }
    }
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

    // Replace field values (split scalars vs vocab refs vs entry refs).
    tx.execute(
        "DELETE FROM entry_field_scalars WHERE entry_id = ?1",
        params![entry.id],
    )?;
    tx.execute(
        "DELETE FROM entry_vocab_refs WHERE entry_id = ?1",
        params![entry.id],
    )?;
    tx.execute(
        "DELETE FROM entry_entry_refs WHERE entry_id = ?1",
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
            (Some(FieldType::Ref), Value::String(target_id)) => {
                tx.execute(
                    "INSERT INTO entry_entry_refs (entry_id, field_key, target_id, position)
                     VALUES (?1, ?2, ?3, 0)",
                    params![entry.id, key, target_id],
                )?;
            }
            (Some(FieldType::RefList), Value::Array(items)) => {
                for (pos, v) in items.iter().enumerate() {
                    if let Value::String(target_id) = v {
                        tx.execute(
                            "INSERT INTO entry_entry_refs (entry_id, field_key, target_id, position)
                             VALUES (?1, ?2, ?3, ?4)",
                            params![entry.id, key, target_id, pos as i64],
                        )?;
                    }
                }
            }
            // Everything else — including ref/vocab fields with null/wrong
            // shape, and unknown field keys — goes into scalars as JSON.
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

    // Body wikilinks → backlinks. Resolved against current entry names
    // and inserted with a synthetic `body` field_key. Deduplicated per
    // (source, target) so 7 mentions of [[B]] in A's body count once.
    let body_refs = extract_body_wikilink_targets(&tx, &entry.id, &entry.body)?;
    for (pos, target_id) in body_refs.iter().enumerate() {
        tx.execute(
            "INSERT INTO entry_entry_refs (entry_id, field_key, target_id, position)
             VALUES (?1, ?2, ?3, ?4)",
            params![entry.id, BODY_REF_FIELD_KEY, target_id, pos as i64],
        )?;
    }

    tx.commit()?;
    drop(conn);
    read_entry(root, &entry.id)
}

/// Parse `[[Name]]` and `[[Template:Name]]` wikilinks from a body and
/// resolve each to an entry id. A match is kept only when it resolves
/// to exactly one entry — ambiguous / missing targets are silently
/// dropped (the body renderer surfaces them as broken links). Results
/// are deduplicated in first-seen order so the position column reflects
/// reading order.
fn extract_body_wikilink_targets(
    conn: &Connection,
    source_entry_id: &str,
    body: &str,
) -> AppResult<Vec<String>> {
    static WIKILINK_RE: OnceLock<Regex> = OnceLock::new();
    let re = WIKILINK_RE
        .get_or_init(|| Regex::new(r"\[\[([^\[\]\n]+?)\]\]").expect("valid wikilink regex"));

    let mut seen: HashSet<String> = HashSet::new();
    let mut out: Vec<String> = Vec::new();

    for cap in re.captures_iter(body) {
        let raw = cap.get(1).map(|m| m.as_str()).unwrap_or("").trim();
        if raw.is_empty() {
            continue;
        }
        let (template_name, entry_name) = match raw.find(':') {
            Some(i) => (Some(raw[..i].trim()), raw[i + 1..].trim()),
            None => (None, raw),
        };
        if entry_name.is_empty() {
            continue;
        }

        if let Some(id) = resolve_wikilink(conn, template_name, entry_name)? {
            // Don't backlink an entry to itself.
            if id == source_entry_id {
                continue;
            }
            if seen.insert(id.clone()) {
                out.push(id);
            }
        }
    }
    Ok(out)
}

fn resolve_wikilink(
    conn: &Connection,
    template_name: Option<&str>,
    entry_name: &str,
) -> AppResult<Option<String>> {
    let rows: Vec<String> = if let Some(t) = template_name {
        let mut stmt = conn.prepare(
            "SELECT e.id FROM entries e
             JOIN templates t ON t.id = e.template_id
             WHERE LOWER(TRIM(e.name)) = LOWER(TRIM(?1))
               AND LOWER(TRIM(t.name)) = LOWER(TRIM(?2))",
        )?;
        let collected: Vec<String> = stmt
            .query_map(params![entry_name, t], |r| r.get::<_, String>(0))?
            .collect::<Result<_, _>>()?;
        collected
    } else {
        let mut stmt = conn.prepare(
            "SELECT id FROM entries WHERE LOWER(TRIM(name)) = LOWER(TRIM(?1))",
        )?;
        let collected: Vec<String> = stmt
            .query_map(params![entry_name], |r| r.get::<_, String>(0))?
            .collect::<Result<_, _>>()?;
        collected
    };
    // Ambiguity (>1 match) counts as unresolved so the user is nudged
    // to disambiguate with a `Template:` prefix.
    if rows.len() == 1 {
        Ok(rows.into_iter().next())
    } else {
        Ok(None)
    }
}

/// All incoming references to `id`, sorted by source name. Powers the
/// "Linked from" panel in the entry editor.
pub fn list_backlinks(root: &Path, id: &str) -> AppResult<Vec<Backlink>> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let mut stmt = conn.prepare(
        "SELECT r.entry_id, r.field_key, e.template_id, e.name
         FROM entry_entry_refs r
         JOIN entries e ON e.id = r.entry_id
         WHERE r.target_id = ?1
         ORDER BY e.name COLLATE NOCASE, r.field_key",
    )?;
    let rows = stmt
        .query_map(params![id], |r| {
            Ok(Backlink {
                source_entry_id: r.get::<_, String>(0)?,
                field_key: r.get::<_, String>(1)?,
                source_template_id: r.get::<_, String>(2)?,
                source_name: r.get::<_, String>(3)?,
            })
        })?
        .collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn delete_entry(root: &Path, id: &str) -> AppResult<()> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    conn.execute("DELETE FROM entries WHERE id = ?1", params![id])?;
    Ok(())
}
