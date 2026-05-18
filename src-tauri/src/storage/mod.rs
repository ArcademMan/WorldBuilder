//! Filesystem-facing layer. Modules here know how to read and write
//! project data on disk; they do not contain business policy and do not
//! know about Tauri commands.

pub mod json_io;
pub mod paths;
pub mod project_store;
pub mod recents_store;
pub mod starter;
