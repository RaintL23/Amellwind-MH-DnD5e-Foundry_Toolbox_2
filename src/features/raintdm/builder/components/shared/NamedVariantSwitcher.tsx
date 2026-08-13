import { memo } from "react";
import { cn } from "@/shared/utils/cn";

export interface NamedVariant {
  id: string;
  name: string;
}

const ACCENT_STYLES = {
  emerald:
    "border-emerald-500 bg-emerald-500/20 text-emerald-300",
  sky: "border-sky-500 bg-sky-500/20 text-sky-300",
  violet:
    "border-violet-500 bg-violet-500/20 text-violet-300",
} as const;

export type NamedVariantAccent = keyof typeof ACCENT_STYLES;

interface NamedVariantSwitcherProps {
  label?: string;
  options: NamedVariant[];
  activeId?: string | null;
  onSelect: (id: string | null) => void;
  accent?: NamedVariantAccent;
  includeBaseOption?: boolean;
  baseLabel?: string;
  className?: string;
}

export const NamedVariantSwitcher = memo(function NamedVariantSwitcher({
  label = "Subspecies",
  options,
  activeId = null,
  onSelect,
  accent = "sky",
  includeBaseOption = true,
  baseLabel = "Base",
  className,
}: NamedVariantSwitcherProps) {
  if (options.length === 0) return null;

  const activeAccent = ACCENT_STYLES[accent];

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {includeBaseOption && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors",
              activeId == null
                ? activeAccent
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {baseLabel}
          </button>
        )}
        {options.map((option) => {
          const isActive = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors",
                isActive
                  ? activeAccent
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
});
