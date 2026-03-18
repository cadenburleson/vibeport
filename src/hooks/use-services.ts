import { useCallback, useEffect, useState } from "react";
import type { DevService } from "@/types/service";
import {
  scanPorts,
  stopService as stopServiceCmd,
  startService as startServiceCmd,
} from "@/tauri/commands";
import { useInterval } from "./use-interval";

interface StoppedService {
  pid: number;
  name: string;
  project_name: string;
  port: number;
  command: string[];
  friendly_command: string;
  cwd: string;
}

export function useServices() {
  const [services, setServices] = useState<DevService[]>([]);
  const [stoppedServices, setStoppedServices] = useState<StoppedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    try {
      const result = await scanPorts();
      setServices(result);
      setError(null);
      // Remove stopped services that are running again
      const runningPids = new Set(result.map((s) => s.pid));
      setStoppedServices((prev) =>
        prev.filter((s) => !runningPids.has(s.pid))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  useInterval(scan, 5000);

  const stopService = useCallback(
    async (service: DevService) => {
      const success = await stopServiceCmd(service.pid);
      if (success && service.cwd) {
        setStoppedServices((prev) => [
          ...prev,
          {
            pid: service.pid,
            name: service.name,
            project_name: service.project_name,
            port: service.port,
            command: service.command,
            friendly_command: service.friendly_command,
            cwd: service.cwd!,
          },
        ]);
      }
      await scan();
      return success;
    },
    [scan]
  );

  const startService = useCallback(
    async (command: string[], cwd: string) => {
      const pid = await startServiceCmd(command, cwd);
      setStoppedServices((prev) =>
        prev.filter(
          (s) =>
            !(
              s.command.join(" ") === command.join(" ") && s.cwd === cwd
            )
        )
      );
      await scan();
      return pid;
    },
    [scan]
  );

  return {
    services,
    stoppedServices,
    loading,
    error,
    scan,
    stopService,
    startService,
  };
}
