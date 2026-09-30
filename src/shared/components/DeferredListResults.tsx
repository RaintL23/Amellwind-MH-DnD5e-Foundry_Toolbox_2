import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";

interface DeferredListResultsProps {
  loading: boolean;
  /** True while debounced search or deferred filter is catching up. */
  updating?: boolean;
  isEmpty: boolean;
  empty: ReactNode;
  children: ReactNode;
  loadingVariant?: "table" | "cards";
  className?: string;
}

/**
 * Keeps list/table content mounted while filters update (opacity + hint),
 * matching bestiary UX — avoids remounting DataTable on every keystroke.
 */
export function DeferredListResults({
  loading,
  updating = false,
  isEmpty,
  empty,
  children,
  loadingVariant = "table",
  className,
}: DeferredListResultsProps) {
  if (loading) {
    return (
      <ListAreaLoading
        variant={loadingVariant === "cards" ? "cards" : undefined}
      />
    );
  }

  if (isEmpty) {
    return <>{empty}</>;
  }

  return (
    <div
      className={cn(
        "transition-opacity duration-150",
        updating && "opacity-60",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StickyListSearchBarProps {
  children: ReactNode;
  className?: string;
  updating?: boolean;
}

/** Sticky search/filter bar for compendium list pages. */
export function StickyListSearchBar({
  children,
  className,
  updating = false,
}: StickyListSearchBarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 shrink-0 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm md:px-6",
        className,
      )}
    >
      {children}
      {updating && (
        <p
          className="mt-2 text-[11px] text-muted-foreground"
          aria-live="polite"
        >
          Updating…
        </p>
      )}
    </div>
  );
}
