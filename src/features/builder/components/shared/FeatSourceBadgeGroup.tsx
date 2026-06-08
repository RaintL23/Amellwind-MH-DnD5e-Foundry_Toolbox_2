import { cn } from "@/shared/utils/cn";
import type { BuilderFeatSource } from "@/shared/types";

export type FeatDataSource = Exclude<BuilderFeatSource, "asi">;

const SOURCES: Array<{
  id: FeatDataSource;
  label: string;
}> = [
  { id: "amellwind", label: "Amellwind Monster Hunter" },
  { id: "dnd2014", label: "D&D 2014" },
  { id: "dnd2024", label: "D&D 2024" },
];

interface FeatSourceBadgeGroupProps {
  value: FeatDataSource;
  onChange: (source: FeatDataSource) => void;
}

export function FeatSourceBadgeGroup({
  value,
  onChange,
}: FeatSourceBadgeGroupProps) {
  return (
    <div className="flex flex-wrap gap-1 normal-case">
      {SOURCES.map((source) => {
        const isSelected = value === source.id;
        return (
          <button
            key={source.id}
            type="button"
            onClick={() => onChange(source.id)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {source.label}
          </button>
        );
      })}
    </div>
  );
}
