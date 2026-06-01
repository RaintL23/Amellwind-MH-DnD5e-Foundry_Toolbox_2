import { DMG_TYPE_LABELS, PROPERTY_LABELS } from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const DMG_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "S", label: "Slashing" },
  { value: "P", label: "Piercing" },
  { value: "B", label: "Bludgeoning" },
];

const PROPERTY_FILTER_OPTIONS = [
  { value: "", label: "All Properties" },
  ...Object.entries(PROPERTY_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

export interface WeaponListFiltersState {
  search: string;
  dmgFilter: string;
  propFilter: string;
}

interface WeaponListFiltersProps {
  filters: WeaponListFiltersState;
  onSearchChange: (value: string) => void;
  onDmgFilterChange: (value: string) => void;
  onPropFilterChange: (value: string) => void;
  onClear: () => void;
}

export function WeaponListFilters({
  filters,
  onSearchChange,
  onDmgFilterChange,
  onPropFilterChange,
  onClear,
}: WeaponListFiltersProps) {
  const { search, dmgFilter, propFilter } = filters;
  const hasActiveFilters = Boolean(search || dmgFilter || propFilter);

  return (
    <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search weapon..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1">
          {DMG_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onDmgFilterChange(value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                dmgFilter === value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {value ? DMG_TYPE_LABELS[value] : label}
            </button>
          ))}
        </div>

        <select
          value={propFilter}
          onChange={(e) => onPropFilterChange(e.target.value)}
          className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PROPERTY_FILTER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
