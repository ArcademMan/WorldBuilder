pub mod commands;
pub mod domain;
pub mod error;
pub mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::open_project,
            commands::recents::list_recent_projects,
            commands::recents::add_recent_project,
            commands::recents::remove_recent_project,
            commands::entry::create_entry,
            commands::entry::list_entries,
            commands::entry::read_entry,
            commands::entry::save_entry,
            commands::entry::delete_entry,
            commands::entry::list_backlinks,
            commands::asset::import_asset,
            commands::asset::read_asset,
            commands::asset::delete_asset,
            commands::template::list_templates,
            commands::template::read_template,
            commands::template::save_template,
            commands::template::delete_template,
            commands::vocabulary::list_vocabularies,
            commands::vocabulary::list_vocabulary_items,
            commands::vocabulary::create_vocabulary,
            commands::vocabulary::create_vocabulary_item,
            commands::vocabulary::rename_vocabulary_item,
            commands::vocabulary::delete_vocabulary_item,
            commands::vocabulary::delete_vocabulary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
