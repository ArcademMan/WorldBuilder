//! The single SQLite database that holds every structured piece of a
//! project: project metadata, templates and their fields, entries and
//! their field values, vocabularies and their items.
//!
//! Schema is idempotent (`CREATE … IF NOT EXISTS`), so `open_or_create`
//! doubles as a "ensure latest schema is applied" migration step.

use std::path::Path;

use rusqlite::{params, Connection};

use crate::error::AppResult;
use crate::storage::timestamp::now_iso;

const SCHEMA: &str = "
-- Project marker / metadata (single row, id always 1).
CREATE TABLE IF NOT EXISTS project_meta (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    name           TEXT    NOT NULL,
    format_version INTEGER NOT NULL,
    created_at     TEXT    NOT NULL
);

-- Vocabularies and their items.
CREATE TABLE IF NOT EXISTS vocabularies (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
    id            TEXT PRIMARY KEY,
    vocabulary_id TEXT NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    label         TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

-- Templates and their fields. Sub-templates use parent_id.
-- ON DELETE SET NULL keeps orphan templates alive if their parent goes;
-- inheritance is resolved against whatever parent_id resolves to at read time.
CREATE TABLE IF NOT EXISTS templates (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    parent_id  TEXT REFERENCES templates(id) ON DELETE SET NULL,
    icon       TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_fields (
    id               TEXT PRIMARY KEY,
    template_id      TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    key              TEXT NOT NULL,
    label            TEXT NOT NULL,
    field_type       TEXT NOT NULL,
    required         INTEGER NOT NULL DEFAULT 0,
    help_text        TEXT,
    vocabulary_id    TEXT,
    ref_template_ids TEXT,    -- JSON-encoded array, nullable
    position         INTEGER NOT NULL,
    UNIQUE(template_id, key)
);

-- Layout: ordered sections owned by a template, each with N columns.
CREATE TABLE IF NOT EXISTS template_layout_sections (
    id          TEXT PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    title       TEXT,
    columns     INTEGER NOT NULL DEFAULT 1
);

-- A single layout item: a template field rendered in a specific column
-- of a section with a chosen display mode (field / image-{size} /
-- table-row). field_key is intentionally not a hard FK — the template
-- editor saves layout + fields in the same transaction so consistency
-- is enforced by the writer, not the schema.
CREATE TABLE IF NOT EXISTS template_layout_items (
    id           TEXT PRIMARY KEY,
    section_id   TEXT NOT NULL REFERENCES template_layout_sections(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL,
    column_index INTEGER NOT NULL DEFAULT 0,
    field_key    TEXT NOT NULL,
    display      TEXT NOT NULL DEFAULT 'field'
);

-- Entries: row per entry + companion tables for tags, scalar values, vocab refs.
CREATE TABLE IF NOT EXISTS entries (
    id          TEXT PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES templates(id),
    name        TEXT NOT NULL,
    summary     TEXT,
    body        TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

-- Tags are vocab refs to the system 'tags' vocabulary.
-- CASCADE on both sides means deleting an entry or an item auto-purges the link.
CREATE TABLE IF NOT EXISTS entry_tags (
    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    item_id  TEXT NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, item_id)
);

-- Scalar field values (string/text/markdown/number/boolean/date/stringList)
-- are kept as JSON for shape flexibility — they are not query targets.
CREATE TABLE IF NOT EXISTS entry_field_scalars (
    entry_id   TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    field_key  TEXT NOT NULL,
    value_json TEXT NOT NULL,
    PRIMARY KEY (entry_id, field_key)
);

-- Vocab references live as real FK rows so the CASCADE on vocabulary_items
-- auto-purges them when an item is deleted — no Rust-side cleanup needed.
CREATE TABLE IF NOT EXISTS entry_vocab_refs (
    entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    item_id   TEXT NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    position  INTEGER NOT NULL,
    PRIMARY KEY (entry_id, field_key, position)
);

-- Imported assets (images today, extensible). The actual file lives at
-- <project>/assets/images/<id><ext>; this table holds only metadata.
-- Entries reference assets by id from image / imageList fields.
CREATE TABLE IF NOT EXISTS assets (
    id                TEXT PRIMARY KEY,
    mime_type         TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    byte_size         INTEGER NOT NULL,
    created_at        TEXT NOT NULL
);

-- Entry-to-entry references (ref / refList fields). CASCADE on both sides
-- keeps the table consistent: deleting either endpoint drops the link, so
-- backlink queries never see dangling rows.
CREATE TABLE IF NOT EXISTS entry_entry_refs (
    entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    target_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    position  INTEGER NOT NULL,
    PRIMARY KEY (entry_id, field_key, position)
);

-- Indexes that pay back the most common queries.
CREATE        INDEX IF NOT EXISTS idx_items_vocab           ON vocabulary_items(vocabulary_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_unique_label    ON vocabulary_items(vocabulary_id, label);
CREATE        INDEX IF NOT EXISTS idx_template_fields_tpl   ON template_fields(template_id);
CREATE        INDEX IF NOT EXISTS idx_entries_template      ON entries(template_id);
CREATE        INDEX IF NOT EXISTS idx_entry_tags_item       ON entry_tags(item_id);
CREATE        INDEX IF NOT EXISTS idx_entry_vocab_refs_item ON entry_vocab_refs(item_id);
CREATE        INDEX IF NOT EXISTS idx_entry_refs_target     ON entry_entry_refs(target_id);
CREATE        INDEX IF NOT EXISTS idx_layout_sections_tpl   ON template_layout_sections(template_id);
CREATE        INDEX IF NOT EXISTS idx_layout_items_section  ON template_layout_items(section_id);
";

/// Opens (creates if missing) the project DB and applies the schema.
/// Foreign keys are enabled per connection.
pub fn open_or_create(path: &Path) -> AppResult<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    conn.execute_batch(SCHEMA)?;
    Ok(conn)
}

/// Inserts the vocabularies every project must ship with.
/// Currently: the system "tags" vocabulary. Idempotent.
pub fn seed_system_vocabularies(conn: &Connection) -> AppResult<()> {
    use crate::domain::vocabulary::{SYSTEM_TAGS_VOCAB_ID, SYSTEM_TAGS_VOCAB_NAME};
    let now = now_iso();
    conn.execute(
        "INSERT OR IGNORE INTO vocabularies (id, name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?3)",
        params![SYSTEM_TAGS_VOCAB_ID, SYSTEM_TAGS_VOCAB_NAME, now],
    )?;
    Ok(())
}
