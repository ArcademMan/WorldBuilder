//! Templates persisted in project.db across two tables:
//! - `templates` (id, name, parent_id, icon, timestamps)
//! - `template_fields` (one row per FieldDef, ordered by `position`)
//!
//! save_template is upsert + replace-all-children inside a transaction
//! so partial writes can't leave half a template behind.

use std::path::Path;

use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::domain::field::{FieldDef, FieldType};
use crate::domain::template::Template;
use crate::error::{AppError, AppResult};
use crate::storage::paths::ProjectPaths;
use crate::storage::project_db;
use crate::storage::timestamp::now_iso;

// --- field type <-> string ------------------------------------------------

pub fn field_type_str(t: &FieldType) -> &'static str {
    match t {
        FieldType::String => "string",
        FieldType::Text => "text",
        FieldType::Markdown => "markdown",
        FieldType::StringList => "stringList",
        FieldType::Number => "number",
        FieldType::Boolean => "boolean",
        FieldType::Date => "date",
        FieldType::Image => "image",
        FieldType::ImageList => "imageList",
        FieldType::Ref => "ref",
        FieldType::RefList => "refList",
        FieldType::Vocab => "vocab",
        FieldType::VocabList => "vocabList",
    }
}

pub fn parse_field_type(s: &str) -> AppResult<FieldType> {
    Ok(match s {
        "string" => FieldType::String,
        "text" => FieldType::Text,
        "markdown" => FieldType::Markdown,
        "stringList" => FieldType::StringList,
        "number" => FieldType::Number,
        "boolean" => FieldType::Boolean,
        "date" => FieldType::Date,
        "image" => FieldType::Image,
        "imageList" => FieldType::ImageList,
        "ref" => FieldType::Ref,
        "refList" => FieldType::RefList,
        "vocab" => FieldType::Vocab,
        "vocabList" => FieldType::VocabList,
        other => return Err(AppError::Message(format!("Unknown field type: {other}"))),
    })
}

// --- read -----------------------------------------------------------------

pub fn list_templates(root: &Path) -> AppResult<Vec<Template>> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    let ids: Vec<String> = {
        let mut stmt = conn.prepare("SELECT id FROM templates ORDER BY name")?;
        let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
        rows.collect::<Result<_, _>>()?
    };
    let mut out = Vec::with_capacity(ids.len());
    for id in ids {
        if let Some(t) = load_template(&conn, &id)? {
            out.push(t);
        }
    }
    Ok(out)
}

pub fn read_template(root: &Path, id: &str) -> AppResult<Template> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    load_template(&conn, id)?.ok_or_else(|| AppError::PathNotFound(format!("template {id}")))
}

fn load_template(conn: &Connection, id: &str) -> AppResult<Option<Template>> {
    let mut stmt = conn
        .prepare("SELECT id, name, parent_id, icon FROM templates WHERE id = ?1")?;
    let opt = stmt
        .query_row(params![id], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, Option<String>>(2)?,
                r.get::<_, Option<String>>(3)?,
            ))
        })
        .optional()?;
    let Some((tid, name, parent_id, icon)) = opt else {
        return Ok(None);
    };
    let fields = load_template_fields(conn, &tid)?;
    Ok(Some(Template {
        id: tid,
        name,
        parent_id,
        icon,
        fields,
    }))
}

fn load_template_fields(conn: &Connection, template_id: &str) -> AppResult<Vec<FieldDef>> {
    let mut stmt = conn.prepare(
        "SELECT id, key, label, field_type, required, help_text, vocabulary_id, ref_template_ids
         FROM template_fields
         WHERE template_id = ?1
         ORDER BY position",
    )?;
    let rows: Vec<(
        String,
        String,
        String,
        String,
        i64,
        Option<String>,
        Option<String>,
        Option<String>,
    )> = stmt
        .query_map(params![template_id], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, i64>(4)?,
                r.get::<_, Option<String>>(5)?,
                r.get::<_, Option<String>>(6)?,
                r.get::<_, Option<String>>(7)?,
            ))
        })?
        .collect::<Result<_, _>>()?;

    let mut defs = Vec::with_capacity(rows.len());
    for (id, key, label, type_str, required, help_text, vocab_id, ref_json) in rows {
        let field_type = parse_field_type(&type_str)?;
        let ref_template_ids = match ref_json {
            Some(s) => Some(serde_json::from_str::<Vec<String>>(&s)?),
            None => None,
        };
        defs.push(FieldDef {
            id: Some(id),
            key,
            label,
            field_type,
            required: if required != 0 { Some(true) } else { None },
            help_text,
            ref_template_ids,
            vocabulary_id: vocab_id,
        });
    }
    Ok(defs)
}

// --- write ----------------------------------------------------------------

pub fn save_template(root: &Path, template: Template) -> AppResult<Template> {
    let paths = ProjectPaths::new(root);
    let mut conn = project_db::open_or_create(&paths.project_db())?;
    let now = now_iso();
    let tx = conn.transaction()?;

    let updated = tx.execute(
        "UPDATE templates SET name = ?1, parent_id = ?2, icon = ?3, updated_at = ?4 WHERE id = ?5",
        params![template.name, template.parent_id, template.icon, now, template.id],
    )?;
    if updated == 0 {
        tx.execute(
            "INSERT INTO templates (id, name, parent_id, icon, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
            params![template.id, template.name, template.parent_id, template.icon, now],
        )?;
    }

    // Snapshot the existing fields so we can detect renames (same id, new key)
    // and migrate already-stored entry values onto the new key before we
    // wipe the template_fields rows.
    let old_keys_by_id: std::collections::HashMap<String, String> = {
        let mut stmt = tx.prepare(
            "SELECT id, key FROM template_fields WHERE template_id = ?1",
        )?;
        let rows = stmt.query_map(params![template.id], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
        })?;
        rows.collect::<Result<_, _>>()?
    };

    for def in template.fields.iter() {
        let Some(field_id) = def.id.as_deref() else { continue };
        let Some(old_key) = old_keys_by_id.get(field_id) else { continue };
        if old_key == &def.key {
            continue;
        }
        // Rename: move existing entry values from old_key to def.key, scoped
        // to entries that use this template.
        tx.execute(
            "UPDATE entry_field_scalars
             SET field_key = ?1
             WHERE field_key = ?2
               AND entry_id IN (SELECT id FROM entries WHERE template_id = ?3)",
            params![def.key, old_key, template.id],
        )?;
        tx.execute(
            "UPDATE entry_vocab_refs
             SET field_key = ?1
             WHERE field_key = ?2
               AND entry_id IN (SELECT id FROM entries WHERE template_id = ?3)",
            params![def.key, old_key, template.id],
        )?;
    }

    tx.execute(
        "DELETE FROM template_fields WHERE template_id = ?1",
        params![template.id],
    )?;
    for (position, def) in template.fields.iter().enumerate() {
        let ref_json = match &def.ref_template_ids {
            Some(v) => Some(serde_json::to_string(v)?),
            None => None,
        };
        let field_id = def
            .id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        tx.execute(
            "INSERT INTO template_fields
             (id, template_id, key, label, field_type, required, help_text,
              vocabulary_id, ref_template_ids, position)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                field_id,
                template.id,
                def.key,
                def.label,
                field_type_str(&def.field_type),
                def.required.unwrap_or(false) as i64,
                def.help_text,
                def.vocabulary_id,
                ref_json,
                position as i64,
            ],
        )?;
    }

    tx.commit()?;
    drop(conn); // release before re-opening
    read_template(root, &template.id)
}

pub fn delete_template(root: &Path, id: &str) -> AppResult<()> {
    let paths = ProjectPaths::new(root);
    let conn = project_db::open_or_create(&paths.project_db())?;
    // Refuse to delete if any entry still points at this template. The
    // user must reassign or delete those entries first.
    let in_use: i64 = conn.query_row(
        "SELECT COUNT(*) FROM entries WHERE template_id = ?1",
        params![id],
        |r| r.get(0),
    )?;
    if in_use > 0 {
        return Err(AppError::Message(format!(
            "Cannot delete template: {in_use} entry/entries still use it"
        )));
    }
    conn.execute("DELETE FROM templates WHERE id = ?1", params![id])?;
    Ok(())
}
