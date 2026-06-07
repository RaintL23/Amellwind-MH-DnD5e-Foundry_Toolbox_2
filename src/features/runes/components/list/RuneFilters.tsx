import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { TIER_LABELS } from "../../constants/rune.constants";
import { MATERIAL_EFFECT_RARITIES } from "@/features/material-effects/constants/material-effect.constants";

export type RuneSlotFilter = "" | "A" | "W";

export interface RuneFiltersState {
  name: string;
  monster: string[];
  slot: RuneSlotFilter;
  obtainment: string[];
  tag: string[];
  monsterTier: string[];
  materialEffectTier: string[];
}

interface RuneFiltersProps {
  filters: RuneFiltersState;
  uniqueMonsters: string[];
  uniqueTags: string[];
  onChange: (filters: RuneFiltersState) => void;
}

const SLOT_OPTIONS = [
  { value: "", label: "All slots" },
  { value: "A", label: "Armor" },
  { value: "W", label: "Weapon" },
] as const satisfies ReadonlyArray<{ value: RuneSlotFilter; label: string }>;

const MONSTER_TIER_OPTIONS = ([1, 2, 3, 4] as const).map((tier) => ({
  value: String(tier),
  label: TIER_LABELS[tier],
}));

const MATERIAL_EFFECT_TIER_OPTIONS = MATERIAL_EFFECT_RARITIES.map((rarity) => ({
  value: rarity,
  label: rarity,
}));

export function RuneFilters({
  filters,
  uniqueMonsters: _uniqueMonsters,
  uniqueTags,
  onChange,
}: RuneFiltersProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div className="relative col-span-2 md:col-span-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search material..."
          value={filters.name}
          onChange={(e) => onChange({ ...filters, name: e.target.value })}
          className="pl-8"
        />
      </div>

      {/* <MultiSelect
        options={uniqueMonsters.map((m) => ({ value: m, label: m }))}
        selected={filters.monster}
        onChange={(monster) => onChange({ ...filters, monster })}
        emptyLabel="All monsters"
        allLabel="All monsters"
        countLabel={(count) => `${count} monsters`}
      /> */}

      <Select
        value={filters.slot}
        onChange={(e) =>
          onChange({ ...filters, slot: e.target.value as RuneSlotFilter })
        }
      >
        {SLOT_OPTIONS.map(({ value, label }) => (
          <option key={value || "all"} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {/* <MultiSelect
        options={OBTAINMENT_OPTIONS}
        selected={filters.obtainment}
        onChange={(obtainment) => onChange({ ...filters, obtainment })}
        emptyLabel="All obtainment"
        allLabel="All obtainment"
        countLabel={(count) => `${count} obtainment`}
      /> */}

      <MultiSelect
        options={uniqueTags.map((tag) => ({ value: tag, label: tag }))}
        selected={filters.tag}
        onChange={(tag) => onChange({ ...filters, tag })}
        emptyLabel="All tags"
        allLabel="All tags"
        countLabel={(count) => `${count} tags`}
      />

      <div className="col-span-2 flex gap-2">
        <MultiSelect
          className="min-w-0 flex-1"
          options={MONSTER_TIER_OPTIONS}
          selected={filters.monsterTier}
          onChange={(monsterTier) => onChange({ ...filters, monsterTier })}
          emptyLabel="All monster tiers"
          allLabel="All monster tiers"
          countLabel={(count) => `${count} monster tiers`}
        />

        <MultiSelect
          className="min-w-0 flex-1"
          options={MATERIAL_EFFECT_TIER_OPTIONS}
          selected={filters.materialEffectTier}
          onChange={(materialEffectTier) =>
            onChange({ ...filters, materialEffectTier })
          }
          emptyLabel="All effect tiers"
          allLabel="All effect tiers"
          countLabel={(count) => `${count} effect tiers`}
        />
      </div>
    </div>
  );
}
