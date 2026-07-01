import type { MaterialEffectSlot } from "@/shared/types";
import type { ResourceRarity } from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  MATERIAL_EFFECT_RARITIES,
  type MaterialEffectFiltersState,
} from "../constants/material-effect.constants";

interface MaterialEffectFiltersProps {
  filters: MaterialEffectFiltersState;
  onChange: (next: MaterialEffectFiltersState) => void;
}

const SLOT_OPTIONS: Array<{ value: MaterialEffectSlot; label: string }> = [
  { value: "armor", label: "Armor" },
  { value: "weapon", label: "Weapon" },
];

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function MaterialEffectFilters({
  filters,
  onChange,
}: MaterialEffectFiltersProps) {
  function toggleSlot(slot: MaterialEffectSlot) {
    onChange({ ...filters, slot: toggleValue(filters.slot, slot) });
  }

  function toggleRarity(rarity: ResourceRarity) {
    onChange({ ...filters, rarity: toggleValue(filters.rarity, rarity) });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={filters.name}
          onChange={(e) => onChange({ ...filters, name: e.target.value })}
          placeholder="Search effect name or text..."
          className="pl-9 h-8 text-sm w-64"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Slot:</span>
        {SLOT_OPTIONS.map(({ value, label }) => {
          const active = filters.slot.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleSlot(value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? value === "weapon"
                    ? "border-orange-500 bg-orange-500/20 text-orange-400"
                    : "border-blue-500 bg-blue-500/20 text-blue-400"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Rarity:</span>
        {MATERIAL_EFFECT_RARITIES.map((rarity) => {
          const active = filters.rarity.includes(rarity);
          return (
            <button
              key={rarity}
              type="button"
              onClick={() => toggleRarity(rarity)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-amber-500 bg-amber-500/20 text-amber-400"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {rarity}
            </button>
          );
        })}
      </div>

      {(filters.slot.length > 0 || filters.rarity.length > 0) && (
        <Badge
          variant="secondary"
          className="cursor-pointer text-xs"
          onClick={() => onChange({ ...filters, slot: [], rarity: [] })}
        >
          Clear filters
        </Badge>
      )}
    </div>
  );
}
