use crate::filter::filter_services;
use crate::scanner::{scan_listening_ports, DevService};
use std::process::Command;
use sysinfo::{Pid, Signal, System};

#[tauri::command]
pub fn scan_ports() -> Vec<DevService> {
    let services = scan_listening_ports();
    filter_services(services)
}

#[tauri::command]
pub fn stop_service(pid: u32) -> bool {
    let mut sys = System::new_all();
    sys.refresh_all();

    let sysinfo_pid = Pid::from(pid as usize);
    if let Some(process) = sys.process(sysinfo_pid) {
        if process.kill_with(Signal::Term).unwrap_or(false) {
            return true;
        }
        // Fallback to SIGKILL
        return process.kill_with(Signal::Kill).unwrap_or(false);
    }
    false
}

#[tauri::command]
pub fn start_service(command: Vec<String>, cwd: String) -> Result<u32, String> {
    if command.is_empty() {
        return Err("Command cannot be empty".to_string());
    }

    let child = Command::new(&command[0])
        .args(&command[1..])
        .current_dir(&cwd)
        .spawn()
        .map_err(|e| format!("Failed to start process: {}", e))?;

    Ok(child.id())
}
