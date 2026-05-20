//! Persists the path of the currently active project across restarts,
//! via `tauri-plugin-store`. Independent from the recents list so that
//! "closing" a project does not remove it from recents.

use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::error::AppResult;

const STORE_FILE: &str = "session.json";
const KEY: &str = "active_project_path";

pub fn get(app: &AppHandle) -> AppResult<Option<String>> {
    let store = app.store(STORE_FILE)?;
    match store.get(KEY) {
        Some(Value::String(s)) => Ok(Some(s)),
        _ => Ok(None),
    }
}

pub fn set(app: &AppHandle, path: &str) -> AppResult<()> {
    let store = app.store(STORE_FILE)?;
    store.set(KEY, Value::String(path.to_string()));
    store.save()?;
    Ok(())
}

pub fn clear(app: &AppHandle) -> AppResult<()> {
    let store = app.store(STORE_FILE)?;
    store.delete(KEY);
    store.save()?;
    Ok(())
}
