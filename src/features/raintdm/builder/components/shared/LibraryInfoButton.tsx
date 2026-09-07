import { Info } from "lucide-react";

/** Compact info control for Builder library rows (preview details without selecting). */
export function LibraryInfoButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`View details for ${label}`}
      aria-label={`View details for ${label}`}
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Info className="h-3 w-3 text-sky-400" />
    </button>
  );
}

export function LibraryBackToListButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2 text-[11px] text-muted-foreground hover:text-foreground"
    >
      Back to list
    </button>
  );
}
