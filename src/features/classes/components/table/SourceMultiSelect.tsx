import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface SourceMultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function SourceMultiSelect({
  options,
  selected,
  onChange,
}: SourceMultiSelectProps) {
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

  const allSelected = selected.length === options.length;
  const label =
    selected.length === 0
      ? "No sources"
      : allSelected
        ? "All sources"
        : `${selected.length} sources`;

  function toggleSource(source: string) {
    if (selected.includes(source)) {
      onChange(selected.filter((s) => s !== source));
    } else {
      onChange([...selected, source].sort((a, b) => a.localeCompare(b)));
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-8 min-w-[140px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-xs",
          "hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-border bg-popover p-2 shadow-md">
          <div className="mb-2 flex gap-2 border-b border-border pb-2">
            <button
              type="button"
              className="text-[11px] text-sky-400 hover:underline"
              onClick={() => onChange([...options])}
            >
              All
            </button>
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:underline"
              onClick={() => onChange([])}
            >
              None
            </button>
          </div>
          <ul className="space-y-1">
            {options.map((source) => {
              const checked = selected.includes(source);
              return (
                <li key={source}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSource(source)}
                      className="rounded border-border"
                    />
                    <span className="font-mono">{source}</span>
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
