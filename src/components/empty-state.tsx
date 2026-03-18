export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium text-muted-foreground">
        No dev servers detected
      </p>
      <p className="mt-2 text-sm text-muted-foreground/70">
        Start a dev server and it will appear here automatically
      </p>
    </div>
  );
}
