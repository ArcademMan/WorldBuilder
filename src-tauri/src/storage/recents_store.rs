//! Persists the "recent projects" list outside of any project folder,
//! via `tauri-plugin-store`.

use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::domain::project::RecentProject;
use crate::error::AppResult;

const STORE_FILE: &str = "recents.json";
const KEY: &str = "items";
const MAX_ENTRIES: usize = 20;

pub fn list(app: &AppHandle) -> AppResult<Vec<RecentProject>> {
    let store = app.store(STORE_FILE)?;
    let raw = store.get(KEY).unwrap_or(Value::Array(vec![]));
    let items: Vec<RecentProject> = serde_json::from_value(raw).unwrap_or_default();
    Ok(items)
}

pub fn add(app: &AppHandle, recent: RecentProject) -> AppResult<Vec<RecentProject>> {
    let mut items = list(app)?;
    items.retain(|r| r.path != recent.path);
    items.insert(0, recent);
    items.truncate(MAX_ENTRIES);
    persist(app, &items)?;
    Ok(items)
}

pub fn remove(app: &AppHandle, path: &str) -> AppResult<Vec<RecentProject>> {
    let mut items = list(app)?;
    items.retain(|r| r.path != path);
    persist(app, &items)?;
    Ok(items)
}

fn persist(app: &AppHandle, items: &[RecentProject]) -> AppResult<()> {
    let store = app.store(STORE_FILE)?;
    store.set(KEY, serde_json::to_value(items)?);
    store.save()?;
    Ok(())
}
