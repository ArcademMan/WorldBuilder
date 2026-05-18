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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
