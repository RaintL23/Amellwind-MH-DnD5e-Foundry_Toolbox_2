import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/cn";

interface MultiSelectFilterProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
  className?: string;
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  emptyLabel = "Any",
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const summary =
    selected.length === 0
      ? emptyLabel
      : selected.length <= 2
        ? selected
            .map(
              (v) => options.find((o) => o.value === v)?.label ?? v,
            )
            .join(", ")
        : `${selected.length} selected`;

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-between font-normal"
          >
            <span className="truncate text-left">{summary}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${label.toLowerCase()}…`}
            className="mb-2 h-8"
          />
          <div className="mb-2 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onChange(options.map((o) => o.value))}
            >
              All
            </Button>
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                No matches
              </p>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(opt.value)}
                    />
                    <span className="text-sm leading-tight">{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
