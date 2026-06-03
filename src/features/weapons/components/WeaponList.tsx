import { useEffect, useMemo, useState } from "react";
import { Weapon } from "@/shared/types";
import { getAllWeapons } from "../services/weapon.service";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { WeaponCard } from "./WeaponCard";
import { WeaponDialog } from "./WeaponDialog";
import { WeaponListFilters } from "./WeaponListFilters";
import { Swords } from "lucide-react";

export function WeaponList() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dmgFilter, setDmgFilter] = useState("");
  const [propFilter, setPropFilter] = useState("");
  const [selected, setSelected] = useState<Weapon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllWeapons()
      .then(setWeapons)
      .finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useDebouncedValue(search);

  const filtered = useMemo(() => {
    let result = weapons;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }
    if (dmgFilter) {
      result = result.filter((w) => w.dmgType === dmgFilter);
    }
    if (propFilter) {
      result = result.filter((w) => w.properties.includes(propFilter));
    }
    return result;
  }, [weapons, debouncedSearch, dmgFilter, propFilter]);

  function handleSelect(weapon: Weapon) {
    setSelected(weapon);
    setDialogOpen(true);
  }

  function clearFilters() {
    setSearch("");
    setDmgFilter("");
    setPropFilter("");
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Hunter Weapons</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {weapons.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          14 weapons from Monster Hunter adapted to the D&D 5e system. Each
          scales from Common to Legendary.
        </p>
      </div>

      <WeaponListFilters
        filters={{ search, dmgFilter, propFilter }}
        onSearchChange={setSearch}
        onDmgFilterChange={setDmgFilter}
        onPropFilterChange={setPropFilter}
        onClear={clearFilters}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading weapons...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Swords className="h-10 w-10 opacity-20" />
            <p className="text-sm">No weapons found with those filters.</p>
            <button
              onClick={clearFilters}
              className="text-xs underline underline-offset-2 hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((weapon) => (
              <WeaponCard
                key={weapon.name}
                weapon={weapon}
                onClick={() => handleSelect(weapon)}
              />
            ))}
          </div>
        )}
      </div>

      <WeaponDialog
        weapon={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
