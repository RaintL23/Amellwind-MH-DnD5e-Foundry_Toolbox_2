import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

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

  function toggleValue(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
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
          <div className="mb-2 flex gap-2 border-b border-border pb-2">
            <button
              type="button"
              className="text-xs text-sky-400 hover:underline"
              onClick={() => onChange([...optionValues])}
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
            {options.map(({ value, label: optionLabel }) => {
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
