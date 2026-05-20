//! Tauri command handlers. Each command is a thin wrapper that parses
//! inputs, delegates to a `storage::` function, and returns an
//! `AppResult` — keeping IO/policy out of the bridge layer.

pub mod asset;
pub mod entry;
pub mod export;
pub mod project;
pub mod recents;
pub mod session;
pub mod template;
pub mod vocabulary;
