export function ClassDetailLoading() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <span className="text-sm">Loading class...</span>
        </div>
      </div>
    </div>
  );
}
