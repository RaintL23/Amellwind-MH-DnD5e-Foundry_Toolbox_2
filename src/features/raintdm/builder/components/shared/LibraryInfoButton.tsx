import { ChevronUp, Info } from "lucide-react";
import { cn } from "@/shared/utils/cn";

/** Details toggle for Builder library rows (expands details inline without selecting). */
export function LibraryInfoButton({
  label,
  expanded,
  onClick,
}: {
  label: string;
  expanded: boolean;
  onClick: () => void;
}) {
  const text = expanded
    ? `Hide details for ${label}`
    : `View details for ${label}`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={text}
      aria-label={text}
      aria-expanded={expanded}
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {expanded ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <Info className="h-3 w-3 text-sky-400" />
      )}
    </button>
  );
}

/** Container for a library row's expanded details. */
export function LibraryRowDetails({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-1.5 cursor-default pl-5 text-left", className)}>
      {children}
    </div>
  );
}

export function LibraryBackToListButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="mb-2 text-[11px] text-muted-foreground hover:text-foreground"
    >
      ← {label}
    </button>
  );
}
