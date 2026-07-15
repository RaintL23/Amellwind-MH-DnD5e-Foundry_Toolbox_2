import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useEffect, useMemo, useCallback, useState } from "react";
import { Weapon } from "@/shared/types";
import { getAllWeapons } from "../services/weapon.service";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListUrlState } from "@/shared/hooks/useListUrlState";
import { WeaponCard } from "./WeaponCard";
import { WeaponDialog } from "./WeaponDialog";
import { WeaponListFilters } from "./WeaponListFilters";
import { weaponMatchesCompatibleProficiency } from "../data/weapon-proficiencies.data";
import { Swords } from "lucide-react";

export function WeaponList() {
  const { getString, setString, patchFields } = useListUrlState();
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Weapon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const urlSearch = getString("q");
  const commitSearchToUrl = useCallback(
    (q: string) => setString("q", q),
    [setString],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending, commitSearch } =
    useDebouncedListSearch(urlSearch, commitSearchToUrl);
  const dmgFilter = getString("dmg");
  const propFilter = getString("prop");
  const compatFilter = getString("compat");

  useEffect(() => {
    getAllWeapons()
      .then(setWeapons)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = weapons;
    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }
    if (dmgFilter) {
      result = result.filter((w) => w.dmgType === dmgFilter);
    }
    if (propFilter) {
      result = result.filter((w) => w.properties.includes(propFilter));
    }
    if (compatFilter) {
      result = result.filter((w) =>
        weaponMatchesCompatibleProficiency(w.name, compatFilter),
      );
    }
    return result;
  }, [weapons, appliedSearch, dmgFilter, propFilter, compatFilter]);

  const handleSelect = useCallback((weapon: Weapon) => {
    setSelected(weapon);
    setDialogOpen(true);
  }, []);

  const clearFilters = useCallback(() => {
    commitSearch("");
    setString("dmg", "");
    setString("prop", "");
    setString("compat", "");
  }, [commitSearch, setString]);

  const applyWeaponFilters = useCallback(
    (dmg: string, prop: string, compat: string) => {
      patchFields({ dmg, prop, compat });
    },
    [patchFields],
  );

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
        filters={{ search: searchDraft, dmgFilter, propFilter, compatFilter }}
        onSearchChange={setSearchDraft}
        onFiltersApply={applyWeaponFilters}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading variant="cards" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
