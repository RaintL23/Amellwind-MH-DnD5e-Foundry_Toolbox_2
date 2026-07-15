import { Skeleton } from "@/components/ui/skeleton";

/** Full-page placeholder used as Suspense fallback for lazy routes. */
export function LoadingScreen() {
  return (
    <div
      className="flex h-full min-h-48 flex-1 flex-col gap-6 p-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2 shrink-0">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-3 shrink-0">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="flex-1 space-y-3 min-h-0">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
