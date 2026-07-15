import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";

type ListAreaLoadingVariant = "rows" | "cards" | "detail";

interface ListAreaLoadingProps {
  variant?: ListAreaLoadingVariant;
  count?: number;
  className?: string;
}

export function ListAreaLoading({
  variant = "rows",
  count,
  className,
}: ListAreaLoadingProps) {
  if (variant === "cards") {
    const cards = count ?? 6;
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
          className,
        )}
        aria-busy="true"
        aria-label="Loading"
      >
        {Array.from({ length: cards }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-4 space-y-3"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div
        className={cn("flex flex-col gap-6 p-6", className)}
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-56 max-w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  const rows = count ?? 8;
  return (
    <div
      className={cn("space-y-3", className)}
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
