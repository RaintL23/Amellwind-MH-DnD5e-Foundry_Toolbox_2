interface ListAreaLoadingProps {
  message?: string;
  accentClassName?: string;
}

export function ListAreaLoading({
  message = "Loading...",
  accentClassName = "border-primary",
}: ListAreaLoadingProps) {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div
          className={`h-8 w-8 animate-spin rounded-full border-2 border-t-transparent ${accentClassName}`}
        />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
