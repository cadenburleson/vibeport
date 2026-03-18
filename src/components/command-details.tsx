import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button variant="ghost" size="icon-xs" onClick={copy}>
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </Button>
  );
}

export function CommandDetails({
  command,
  friendlyCommand,
  cwd,
}: {
  command: string[];
  friendlyCommand: string;
  cwd: string | null;
}) {
  const cmdString = command.join(" ");

  return (
    <div className="space-y-2 pt-2 text-xs">
      <div>
        <div className="mb-1 flex items-center gap-1 text-muted-foreground">
          <span>Command</span>
          <CopyButton text={friendlyCommand} />
        </div>
        <code className="block rounded bg-muted px-2 py-1 font-mono text-xs break-all">
          {friendlyCommand}
        </code>
      </div>
      {friendlyCommand !== cmdString && (
        <div>
          <div className="mb-1 flex items-center gap-1 text-muted-foreground">
            <span>Raw command</span>
            <CopyButton text={cmdString} />
          </div>
          <code className="block rounded bg-muted px-2 py-1 font-mono text-xs break-all text-muted-foreground">
            {cmdString}
          </code>
        </div>
      )}
      {cwd && (
        <div>
          <div className="mb-1 flex items-center gap-1 text-muted-foreground">
            <span>Working directory</span>
            <CopyButton text={cwd} />
          </div>
          <code className="block rounded bg-muted px-2 py-1 font-mono text-xs break-all">
            {cwd}
          </code>
        </div>
      )}
    </div>
  );
}
