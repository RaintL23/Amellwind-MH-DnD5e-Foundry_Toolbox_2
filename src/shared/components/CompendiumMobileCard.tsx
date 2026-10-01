import { memo, type ReactNode } from "react";

interface CompendiumMobileCardProps {
  title: string;
  onSelect: () => void;
  /** Primary meta row (badges, level, CR, etc.). */
  primary?: ReactNode;
  /** Secondary meta line (type, size, source…). */
  secondary?: ReactNode;
}

/**
 * Touch-friendly list row for DataTable `renderMobileRow` (below `md`).
 */
export const CompendiumMobileCard = memo(function CompendiumMobileCard({
  title,
  onSelect,
  primary,
  secondary,
}: CompendiumMobileCardProps) {
  return (
    <button
      type="button"
      className="flex min-h-14 w-full flex-col gap-1 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/40"
      onClick={onSelect}
    >
      <p className="truncate font-medium text-foreground">{title}</p>
      {primary ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {primary}
        </div>
      ) : null}
      {secondary ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {secondary}
        </p>
      ) : null}
    </button>
  );
});
