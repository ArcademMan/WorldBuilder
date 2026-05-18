//! Per-project SQLite database holding the vocabularies and their
//! items. Schema is idempotent — calling `open_or_create` is the
//! migration: missing tables/indexes are created in place.

use std::path::Path;

use rusqlite::{params, Connection};

use crate::error::AppResult;
use crate::storage::timestamp::now_iso;

/// Schema applied on every open. `CREATE TABLE IF NOT EXISTS` makes it
/// idempotent so we can run it as a free migration on every connection.
const SCHEMA: &str = "
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

CREATE INDEX        IF NOT EXISTS idx_items_vocab         ON vocabulary_items(vocabulary_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_unique_label  ON vocabulary_items(vocabulary_id, label);
";

/// Opens (creates if missing) the project's vocab DB and applies the
/// schema. Foreign keys are enabled per-connection.
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
