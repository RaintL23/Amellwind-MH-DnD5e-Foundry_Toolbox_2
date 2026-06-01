import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TIER_LABELS } from "../constants/rune.constants";

export interface RuneFiltersState {
  name: string;
  monster: string;
  slot: string;
  obtainment: string;
  tag: string;
  tier: string;
}

interface RuneFiltersProps {
  filters: RuneFiltersState;
  uniqueMonsters: string[];
  uniqueTags: string[];
  onChange: (filters: RuneFiltersState) => void;
}

export function RuneFilters({
  filters,
  uniqueMonsters,
  uniqueTags,
  onChange,
}: RuneFiltersProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div className="relative col-span-2 md:col-span-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar material…"
          value={filters.name}
          onChange={(e) => onChange({ ...filters, name: e.target.value })}
          className="pl-8"
        />
      </div>

      <Select
        value={filters.monster}
        onChange={(e) => onChange({ ...filters, monster: e.target.value })}
      >
        <option value="">Todos los monstruos</option>
        {uniqueMonsters.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>

      <Select
        value={filters.slot}
        onChange={(e) => onChange({ ...filters, slot: e.target.value })}
      >
        <option value="">Todos los slots</option>
        <option value="A">Armor</option>
        <option value="W">Weapon</option>
      </Select>

      <Select
        value={filters.obtainment}
        onChange={(e) => onChange({ ...filters, obtainment: e.target.value })}
      >
        <option value="">Toda obtención</option>
        <option value="Carveable">Carveable</option>
        <option value="Capturable">Capturable</option>
        <option value="Ambas">Ambas</option>
      </Select>

      <Select
        value={filters.tag}
        onChange={(e) => onChange({ ...filters, tag: e.target.value })}
      >
        <option value="">Todos los tags</option>
        {uniqueTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </Select>

      <Select
        value={filters.tier}
        onChange={(e) => onChange({ ...filters, tier: e.target.value })}
      >
        <option value="">Todos los tiers</option>
        {([1, 2, 3, 4] as const).map((t) => (
          <option key={t} value={t}>
            {TIER_LABELS[t]}
          </option>
        ))}
      </Select>
    </div>
  );
}
