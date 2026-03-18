export interface DevService {
  pid: number;
  name: string;
  project_name: string;
  port: number;
  protocol: string;
  command: string[];
  friendly_command: string;
  cwd: string | null;
  exe: string | null;
  memory_bytes: number;
  virtual_memory_bytes: number;
  cpu_usage: number;
}
