import { memo } from "react";
import { cn } from "@/shared/utils/cn";
import type { ListFilterOption } from "./list-filter.types";
import { isFilterOptionSelected } from "./list-filter.utils";

export const ListFilterPill = memo(function ListFilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-medium",
        active
          ? "border-primary/50 bg-primary/20 text-primary"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
});

export function OptionPillRow({
  options,
  selectedSet,
  onToggle,
}: {
  options: ListFilterOption[];
  selectedSet: Set<string>;
  onToggle: (option: ListFilterOption) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <ListFilterPill
          key={option.value}
          label={option.label}
          active={isFilterOptionSelected(option, selectedSet)}
          onClick={() => onToggle(option)}
        />
      ))}
    </div>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-normal normal-case tracking-normal text-primary">
      {count}
    </span>
  );
}
