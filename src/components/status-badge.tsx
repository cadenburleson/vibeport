import { Badge } from "@/components/ui/badge";

export function StatusBadge({ running }: { running: boolean }) {
  return (
    <Badge variant={running ? "secondary" : "destructive"}>
      <span
        className={`inline-block size-2 rounded-full ${
          running ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {running ? "Running" : "Stopped"}
    </Badge>
  );
}
