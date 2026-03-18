import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  serviceCount: number;
  onRefresh: () => void;
}

export function Header({ serviceCount, onRefresh }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">VibePort</h1>
        <Badge variant="secondary">{serviceCount}</Badge>
      </div>
      <Button variant="ghost" size="icon" onClick={onRefresh}>
        <RefreshCw className="size-4" />
      </Button>
    </header>
  );
}
