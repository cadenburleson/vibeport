import { invoke } from "@tauri-apps/api/core";
import type { DevService } from "@/types/service";

export async function scanPorts(): Promise<DevService[]> {
  return invoke<DevService[]>("scan_ports");
}

export async function stopService(pid: number): Promise<boolean> {
  return invoke<boolean>("stop_service", { pid });
}

export async function startService(
  command: string[],
  cwd: string
): Promise<number> {
  return invoke<number>("start_service", { command, cwd });
}
