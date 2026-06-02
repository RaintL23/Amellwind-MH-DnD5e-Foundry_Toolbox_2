import { User } from "lucide-react";

interface ClassListHeaderProps {
  loading: boolean;
  listCount: number;
  totalCount: number;
}

export function ClassListHeader({
  loading,
  listCount,
  totalCount,
}: ClassListHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border px-6 py-5">
      <div className="flex items-center gap-3 mb-1">
        <User className="h-6 w-6 text-sky-400" />
        <h1 className="text-xl font-bold text-foreground">
          Classes (D&amp;D 5e)
        </h1>
        {!loading && (
          <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {listCount} classes
            {listCount < totalCount && (
              <span className="opacity-70"> ({totalCount} entries)</span>
            )}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        One row per class name; open a class to view level progression,
        features, and subclasses.
      </p>
    </div>
  );
}
