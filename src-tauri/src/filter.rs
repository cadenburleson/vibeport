use crate::scanner::DevService;

/// Ports commonly used by system services that should be hidden.
const SYSTEM_PORTS: &[u16] = &[
    22, 53, 80, 88, 123, 137, 138, 139, 443, 445, 515, 548, 631, 749, 993, 995, 5353,
];

/// Process names that belong to macOS system services.
const SYSTEM_PROCESS_NAMES: &[&str] = &[
    "launchd",
    "kernel_task",
    "WindowServer",
    "mds",
    "mds_stores",
    "mdworker",
    "cupsd",
    "rapportd",
    "sharingd",
    "controlcenter",
    "airplayuidagent",
    "WiFiAgent",
    "bluetoothd",
    "configd",
    "coreaudiod",
    "coreservicesd",
    "distnoted",
    "fseventsd",
    "loginwindow",
    "notifyd",
    "opendirectoryd",
    "powerd",
    "securityd",
    "syslogd",
    "UserEventAgent",
    "SystemUIServer",
    "Finder",
    "Dock",
    "httpd",
    "apsd",
];

/// Process names commonly associated with dev servers.
const DEV_PROCESS_NAMES: &[&str] = &[
    "node", "python", "python3", "ruby", "java", "go", "cargo", "deno", "bun", "php", "dotnet",
    "vite", "webpack", "next", "uvicorn", "gunicorn", "nodemon", "tsx", "ts-node", "esbuild",
    "turbo", "remix", "nuxt", "nest", "flask", "django", "rails",
];

/// Dev-friendly port ranges.
const DEV_PORT_RANGES: &[(u16, u16)] = &[
    (3000, 3999),
    (4000, 4999),
    (5000, 5999),
    (8000, 8999),
    (9000, 9999),
];

fn is_system_port(port: u16) -> bool {
    SYSTEM_PORTS.contains(&port)
}

fn is_system_process(name: &str) -> bool {
    let lower = name.to_lowercase();
    SYSTEM_PROCESS_NAMES
        .iter()
        .any(|s| s.to_lowercase() == lower)
}

fn is_dev_process(name: &str) -> bool {
    let lower = name.to_lowercase();
    DEV_PROCESS_NAMES
        .iter()
        .any(|s| lower.contains(&s.to_lowercase()))
}

fn is_dev_port(port: u16) -> bool {
    DEV_PORT_RANGES
        .iter()
        .any(|(lo, hi)| port >= *lo && port <= *hi)
}

/// Filter out system services and keep likely dev servers.
/// Strategy:
/// - Block anything on a known system port
/// - Block known system process names
/// - Keep anything on port >= 1024 that isn't explicitly a system process
pub fn filter_services(services: Vec<DevService>) -> Vec<DevService> {
    let mut filtered: Vec<DevService> = services
        .into_iter()
        .filter(|s| {
            if is_system_port(s.port) {
                return false;
            }
            if is_system_process(&s.name) {
                return false;
            }
            // Keep if port >= 1024 (user ports)
            s.port >= 1024
        })
        .collect();

    // Sort: dev processes on dev ports first, then dev ports, then dev processes, then rest
    filtered.sort_by(|a, b| {
        let a_dev_proc = is_dev_process(&a.name);
        let b_dev_proc = is_dev_process(&b.name);
        let a_dev_port = is_dev_port(a.port);
        let b_dev_port = is_dev_port(b.port);

        let a_score = (a_dev_proc as u8) + (a_dev_port as u8);
        let b_score = (b_dev_proc as u8) + (b_dev_port as u8);

        b_score.cmp(&a_score).then(a.port.cmp(&b.port))
    });

    filtered
}
