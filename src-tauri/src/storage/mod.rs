//! Filesystem-facing layer. Modules here know how to read and write
//! project data on disk; they do not contain business policy and do not
//! know about Tauri commands.

pub mod entry_store;
pub mod json_io;
pub mod paths;
pub mod project_store;
pub mod recents_store;
pub mod starter;
pub mod template_store;
pub mod timestamp;
pub mod vocab_db;
pub mod vocab_store;
