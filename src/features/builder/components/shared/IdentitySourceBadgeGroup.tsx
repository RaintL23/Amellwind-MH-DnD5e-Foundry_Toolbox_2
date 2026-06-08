import { cn } from "@/shared/utils/cn";

export type IdentityDataSource = "amellwind" | "dnd";

const SOURCES: Array<{
  id: IdentityDataSource;
  label: string;
  disabled?: boolean;
  disabledHint?: string;
}> = [
  {
    id: "amellwind",
    label: "Amellwind Monster Hunter",
  },
  {
    id: "dnd",
    label: "Dungeons & Dragons",
  },
];

interface IdentitySourceBadgeGroupProps {
  value: IdentityDataSource;
  onChange: (source: IdentityDataSource) => void;
}

export function IdentitySourceBadgeGroup({
  value,
  onChange,
}: IdentitySourceBadgeGroupProps) {
  return (
    <div className="flex flex-wrap gap-1 normal-case">
      {SOURCES.map((source) => {
        const isSelected = value === source.id;
        return (
          <button
            key={source.id}
            type="button"
            disabled={source.disabled}
            title={source.disabled ? source.disabledHint : undefined}
            onClick={() => onChange(source.id)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
              source.disabled &&
                "cursor-not-allowed opacity-45",
              isSelected
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
              !source.disabled &&
                !isSelected &&
                "hover:border-primary/40 hover:bg-muted/50",
            )}
          >
            {source.label}
          </button>
        );
      })}
    </div>
  );
}
