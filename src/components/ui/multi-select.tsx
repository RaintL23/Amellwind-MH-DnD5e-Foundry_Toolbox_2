import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/cn";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Shown when nothing is selected (typically means "no filter"). */
  emptyLabel: string;
  /** Shown when every option is selected. Defaults to emptyLabel. */
  allLabel?: string;
  /** Shown when some but not all options are selected, e.g. "3 selected". */
  countLabel?: (count: number) => string;
  /** Label for the clear-all shortcut inside the dropdown. Defaults to "None". */
  clearLabel?: string;
  /** Label for the select-all shortcut inside the dropdown. Defaults to "All". */
  selectAllLabel?: string;
  /** Show a search input to filter options inside the dropdown. */
  searchable?: boolean;
  /** Placeholder for the search input. Defaults to "Search...". */
  searchPlaceholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  emptyLabel,
  allLabel,
  countLabel = (count) => `${count} selected`,
  clearLabel = "None",
  selectAllLabel = "All",
  searchable = false,
  searchPlaceholder = "Search...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      return;
    }

    if (searchable) {
      searchInputRef.current?.focus();
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, searchable]);

  const optionValues = options.map((option) => option.value);
  const allSelected =
    options.length > 0 && selected.length === options.length;
  const resolvedAllLabel = allLabel ?? emptyLabel;
  const label =
    selected.length === 0
      ? emptyLabel
      : allSelected
        ? resolvedAllLabel
        : countLabel(selected.length);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleOptions =
    searchable && normalizedQuery
      ? options.filter(({ label, value }) =>
          label.toLowerCase().includes(normalizedQuery) ||
          value.toLowerCase().includes(normalizedQuery),
        )
      : options;

  function toggleValue(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function selectVisible() {
    const visibleValues = visibleOptions.map((option) => option.value);
    onChange([...new Set([...selected, ...visibleValues])]);
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 max-h-64 w-full min-w-[12rem] overflow-y-auto rounded-md border border-border bg-popover p-2 shadow-md">
          {searchable && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-7 text-xs"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="mb-2 flex gap-2 border-b border-border pb-2">
            <button
              type="button"
              className="text-xs text-sky-400 hover:underline"
              onClick={() =>
                searchable && normalizedQuery
                  ? selectVisible()
                  : onChange([...optionValues])
              }
            >
              {selectAllLabel}
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => onChange([])}
            >
              {clearLabel}
            </button>
          </div>
          <ul className="space-y-1">
            {visibleOptions.length === 0 ? (
              <li className="px-1.5 py-2 text-xs text-muted-foreground">
                No results
              </li>
            ) : null}
            {visibleOptions.map(({ value, label: optionLabel }) => {
              const checked = selected.includes(value);
              return (
                <li key={value}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleValue(value)}
                      className="rounded border-border"
                    />
                    <span>{optionLabel}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
