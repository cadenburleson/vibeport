import { useState } from "react";
import { ChevronDown, Square, Play, MemoryStick, EyeOff, Eye } from "lucide-react";
import type { DevService } from "@/types/service";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./status-badge";
import { CommandDetails } from "./command-details";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ServiceCardProps {
  service: DevService;
  hidden?: boolean;
  onStop: (service: DevService) => void;
  onToggleHidden?: (port: number) => void;
}

export function ServiceCard({ service, hidden, onStop, onToggleHidden }: ServiceCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className={hidden ? "opacity-40 grayscale" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="truncate">{service.project_name}</CardTitle>
          <div className="flex items-center gap-1">
            {onToggleHidden && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onToggleHidden(service.port)}
                title={hidden ? "Show service" : "Hide service"}
              >
                {hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              </Button>
            )}
            <StatusBadge running />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge>{service.name}</Badge>
          <Badge variant="outline">:{service.port}</Badge>
          <Badge variant="secondary">PID {service.pid}</Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Popover>
            <PopoverTrigger className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer underline decoration-dotted underline-offset-4">
              <MemoryStick className="size-3" />
              {formatBytes(service.memory_bytes)}
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs" side="bottom" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Memory Details</h4>
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resident (RSS)</span>
                    <span className="font-mono">{formatBytes(service.memory_bytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Virtual (VSZ)</span>
                    <span className="font-mono">{formatBytes(service.virtual_memory_bytes)}</span>
                  </div>
                  <Separator />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    RSS is the actual physical memory used. Virtual memory includes memory-mapped files and shared libraries.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <span>CPU: {service.cpu_usage.toFixed(1)}%</span>
        </div>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ChevronDown
              className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
            />
            Details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CommandDetails command={service.command} friendlyCommand={service.friendly_command} cwd={service.cwd} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onStop(service)}
        >
          <Square className="size-3" />
          Stop
        </Button>
      </CardFooter>
    </Card>
  );
}

interface StoppedServiceCardProps {
  name: string;
  projectName: string;
  port: number;
  command: string[];
  cwd: string;
  onStart: (command: string[], cwd: string) => void;
}

export function StoppedServiceCard({
  name,
  projectName,
  port,
  command,
  cwd,
  onStart,
}: StoppedServiceCardProps) {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="truncate">{projectName}</CardTitle>
          <StatusBadge running={false} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge>{name}</Badge>
          <Badge variant="outline">:{port}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" onClick={() => onStart(command, cwd)}>
          <Play className="size-3" />
          Start
        </Button>
      </CardFooter>
    </Card>
  );
}
