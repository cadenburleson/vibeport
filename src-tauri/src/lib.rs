mod commands;
mod filter;
mod scanner;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_ports,
            commands::stop_service,
            commands::start_service,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
