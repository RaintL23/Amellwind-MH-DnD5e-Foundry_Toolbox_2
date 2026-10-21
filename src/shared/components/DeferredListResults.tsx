import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";

interface DeferredListResultsProps {
  loading: boolean;
  /** True while debounced search or deferred filter is catching up. */
  updating?: boolean;
  isEmpty: boolean;
  empty: ReactNode;
  children: ReactNode;
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
  className,
}: DeferredListResultsProps) {
  if (loading) {
    return <ListAreaLoading />;
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

interface ListEmptyStateProps {
  icon: LucideIcon;
  message: ReactNode;
  messageClassName?: string;
  /** Extra actions below the message (e.g. "Clear filters"). */
  children?: ReactNode;
}

/** Centered icon + message for empty compendium lists. */
export function ListEmptyState({
  icon: Icon,
  message,
  messageClassName,
  children,
}: ListEmptyStateProps) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Icon className="h-10 w-10 opacity-20" />
      <p className={cn("text-sm", messageClassName)}>{message}</p>
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
