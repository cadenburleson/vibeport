use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevService {
    pub pid: u32,
    pub name: String,
    pub project_name: String,
    pub port: u16,
    pub protocol: String,
    pub command: Vec<String>,
    pub friendly_command: String,
    pub cwd: Option<String>,
    pub exe: Option<String>,
    pub memory_bytes: u64,
    pub virtual_memory_bytes: u64,
    pub cpu_usage: f32,
}

/// Extract the project/folder name from a cwd path.
fn extract_project_name(cwd: &Option<String>) -> String {
    match cwd {
        Some(path) => {
            let p = std::path::Path::new(path);
            p.file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string())
        }
        None => "Unknown".to_string(),
    }
}

/// Try to reconstruct the friendly/original run command from the raw argv.
/// e.g. "node /path/to/node_modules/.bin/vite" -> "npx vite"
/// e.g. "python -m http.server 8000" -> "python -m http.server 8000"
fn make_friendly_command(command: &[String], cwd: &Option<String>) -> String {
    if command.is_empty() {
        return "Unknown".to_string();
    }

    let first = &command[0];

    // Check if the command is running via node_modules/.bin (npm/npx scripts)
    if first.contains("node_modules/.bin/") || first.contains("node_modules\\.bin\\") {
        // Extract the binary name from the path
        let bin_name = std::path::Path::new(first)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| first.clone());
        let rest: Vec<&String> = command.iter().skip(1).collect();

        // Check if we can find a matching script in package.json
        if let Some(ref dir) = cwd {
            if let Some(script_name) = find_npm_script(dir, &bin_name, &rest) {
                return format!("npm run {}", script_name);
            }
        }

        if rest.is_empty() {
            return format!("npx {}", bin_name);
        }
        return format!("npx {} {}", bin_name, rest.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(" "));
    }

    // If first arg is "node" and second arg is a node_modules path
    if (first == "node" || first.ends_with("/node")) && command.len() > 1 {
        let second = &command[1];
        if second.contains("node_modules/.bin/") || second.contains("node_modules\\.bin\\") {
            let bin_name = std::path::Path::new(second)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| second.clone());
            let rest: Vec<&String> = command.iter().skip(2).collect();

            if let Some(ref dir) = cwd {
                if let Some(script_name) = find_npm_script(dir, &bin_name, &rest) {
                    return format!("npm run {}", script_name);
                }
            }

            if rest.is_empty() {
                return format!("npx {}", bin_name);
            }
            return format!("npx {} {}", bin_name, rest.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(" "));
        }
    }

    // For python -m module commands, keep as-is
    // For everything else, just show the basename of the executable + args
    let exe_name = std::path::Path::new(first)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| first.clone());

    let rest: Vec<&String> = command.iter().skip(1).collect();
    if rest.is_empty() {
        exe_name
    } else {
        format!("{} {}", exe_name, rest.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(" "))
    }
}

/// Try to find an npm script name that matches the given binary and args.
fn find_npm_script(cwd: &str, bin_name: &str, args: &[&String]) -> Option<String> {
    let pkg_path = std::path::Path::new(cwd).join("package.json");
    let content = std::fs::read_to_string(pkg_path).ok()?;
    let pkg: serde_json::Value = serde_json::from_str(&content).ok()?;
    let scripts = pkg.get("scripts")?.as_object()?;

    for (script_name, script_val) in scripts {
        if let Some(script_cmd) = script_val.as_str() {
            // Check if the script command matches the binary name
            // e.g. "dev": "vite" or "dev": "vite --port 3000"
            let script_parts: Vec<&str> = script_cmd.split_whitespace().collect();
            if let Some(first_part) = script_parts.first() {
                if *first_part == bin_name {
                    let script_args: Vec<&str> = script_parts.iter().skip(1).copied().collect();
                    let run_args: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
                    if script_args == run_args {
                        return Some(script_name.clone());
                    }
                }
            }
        }
    }
    None
}

/// Parsed entry from lsof output.
struct LsofEntry {
    pid: u32,
    command: String,
    port: u16,
}

/// Parse the structured `-F` output from lsof.
/// Fields: p=PID, c=command name, n=name (contains host:port).
fn parse_lsof_output(output: &str) -> Vec<LsofEntry> {
    let mut entries = Vec::new();
    let mut current_pid: Option<u32> = None;
    let mut current_command: Option<String> = None;

    for line in output.lines() {
        if line.is_empty() {
            continue;
        }
        let (field, value) = (line.as_bytes()[0], &line[1..]);
        match field {
            b'p' => {
                current_pid = value.parse().ok();
            }
            b'c' => {
                current_command = Some(value.to_string());
            }
            b'n' => {
                // Format is typically "*:PORT" or "127.0.0.1:PORT" or "[::1]:PORT"
                if let Some(port_str) = value.rsplit(':').next() {
                    if let Ok(port) = port_str.parse::<u16>() {
                        if let (Some(pid), Some(ref cmd)) = (current_pid, &current_command) {
                            entries.push(LsofEntry {
                                pid,
                                command: cmd.clone(),
                                port,
                            });
                        }
                    }
                }
            }
            _ => {}
        }
    }

    entries
}

/// Scan for TCP listening ports and enrich with process details from sysinfo.
pub fn scan_listening_ports() -> Vec<DevService> {
    let output = Command::new("lsof")
        .args(["-iTCP", "-sTCP:LISTEN", "-n", "-P", "-F", "pcn"])
        .output();

    let output = match output {
        Ok(o) => o,
        Err(_) => return Vec::new(),
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let entries = parse_lsof_output(&stdout);

    if entries.is_empty() {
        return Vec::new();
    }

    let mut sys = System::new_all();
    sys.refresh_all();

    // Deduplicate by (pid, port)
    let mut seen = std::collections::HashSet::new();
    let mut unique_entries = Vec::new();
    for entry in entries {
        if seen.insert((entry.pid, entry.port)) {
            unique_entries.push(entry);
        }
    }

    // Build a PID -> process info map
    let processes = sys.processes();
    let mut pid_info: HashMap<u32, _> = HashMap::new();
    for (sysinfo_pid, process) in processes {
        let pid_u32 = sysinfo_pid.as_u32();
        pid_info.insert(pid_u32, process);
    }

    let mut services = Vec::new();
    for entry in unique_entries {
        let (command, cwd, exe, memory_bytes, virtual_memory_bytes, cpu_usage) = if let Some(proc) = pid_info.get(&entry.pid) {
            let cmd_strs: Vec<String> = proc.cmd().iter().map(|s| s.to_string_lossy().to_string()).collect();
            let cmd = if cmd_strs.is_empty() {
                vec![entry.command.clone()]
            } else {
                cmd_strs
            };
            (
                cmd,
                proc.cwd().map(|p| p.to_string_lossy().to_string()),
                proc.exe().map(|p| p.to_string_lossy().to_string()),
                proc.memory(),
                proc.virtual_memory(),
                proc.cpu_usage(),
            )
        } else {
            (vec![entry.command.clone()], None, None, 0, 0, 0.0)
        };

        let project_name = extract_project_name(&cwd);
        let friendly_command = make_friendly_command(&command, &cwd);

        services.push(DevService {
            pid: entry.pid,
            name: entry.command.clone(),
            project_name,
            port: entry.port,
            protocol: "TCP".to_string(),
            command,
            friendly_command,
            cwd,
            exe,
            memory_bytes,
            virtual_memory_bytes,
            cpu_usage,
        });
    }

    // Deduplicate by port: when multiple PIDs listen on the same port
    // (e.g. parent + worker process), keep the one with higher memory usage
    let mut by_port: HashMap<u16, DevService> = HashMap::new();
    for service in services {
        let entry = by_port.entry(service.port).or_insert_with(|| service.clone());
        if service.memory_bytes > entry.memory_bytes {
            *entry = service;
        }
    }

    by_port.into_values().collect()
}
