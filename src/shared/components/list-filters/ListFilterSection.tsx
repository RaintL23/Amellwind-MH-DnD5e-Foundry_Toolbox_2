import { memo, useCallback, useMemo } from "react";
import { cn } from "@/shared/utils/cn";
import type { ListFilterOption } from "./list-filter.types";
import { toggleMultiFilterValue } from "./list-filter.utils";

/** Max pills rendered per large section when the dialog search is empty. */
export const LARGE_FILTER_SECTION_PILL_CAP = 36;

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

export const ListFilterSection = memo(function ListFilterSection({
  title,
  options,
  selected,
  onChange,
  searchQuery,
  mode = "multi",
}: {
  title: string;
  options: ListFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchQuery: string;
  mode?: "multi" | "single";
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const { visibleOptions, hiddenCount } = useMemo(() => {
    const sectionMatches =
      !normalizedQuery || title.toLowerCase().includes(normalizedQuery);

    const matched = options.filter(
      (option) =>
        sectionMatches ||
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.value.toLowerCase().includes(normalizedQuery),
    );

    if (normalizedQuery || matched.length <= LARGE_FILTER_SECTION_PILL_CAP) {
      return { visibleOptions: matched, hiddenCount: 0 };
    }

    const selectedOptions = matched.filter((option) =>
      selectedSet.has(option.value),
    );
    const unselected = matched.filter(
      (option) => !selectedSet.has(option.value),
    );
    const remainingSlots = Math.max(
      0,
      LARGE_FILTER_SECTION_PILL_CAP - selectedOptions.length,
    );

    return {
      visibleOptions: [
        ...selectedOptions,
        ...unselected.slice(0, remainingSlots),
      ],
      hiddenCount: matched.length - selectedOptions.length - remainingSlots,
    };
  }, [normalizedQuery, options, selectedSet, title]);

  const selectAll = useCallback(() => {
    onChange(options.map((option) => option.value));
  }, [onChange, options]);

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const toggle = useCallback(
    (value: string) => {
      if (mode === "single") {
        onChange(selectedSet.has(value) ? [] : [value]);
        return;
      }
      onChange(toggleMultiFilterValue(selected, value));
    },
    [mode, onChange, selected, selectedSet],
  );

  if (visibleOptions.length === 0 && hiddenCount === 0) return null;

  return (
    <section className="space-y-2.5 border-b border-border/60 pb-4 last:border-b-0 last:pb-0 [content-visibility:auto]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1.5">
          {mode === "multi" && (
            <>
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                All
              </button>
              <span className="text-muted-foreground/40">|</span>
            </>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleOptions.map((option) => (
          <ListFilterPill
            key={option.value}
            label={option.label}
            active={selectedSet.has(option.value)}
            onClick={() => toggle(option.value)}
          />
        ))}
      </div>
      {hiddenCount > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {hiddenCount} more — use the search box above to narrow{" "}
          {title.toLowerCase()}.
        </p>
      )}
    </section>
  );
});
