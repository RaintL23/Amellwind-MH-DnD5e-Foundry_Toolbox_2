import {
  DeferredListResults,
  ListEmptyState,
} from "@/shared/components/DeferredListResults";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiegeWeapon } from "@/shared/types";
import { getAllSiegeWeapons } from "../services/siege-weapon.service";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListItemUrlParam } from "@/shared/hooks/useListItemUrlParam";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { ClearableSearchInput } from "@/shared/components/list-filters";
import { SiegeWeaponDataTable } from "./SiegeWeaponDataTable";
import { SiegeWeaponDetailDialog } from "./SiegeWeaponDetailDialog";
import { DragonshipRulesPanel } from "./DragonshipRulesPanel";
import { Crosshair } from "lucide-react";

export function SiegeWeaponList() {
  const { q, patchFilters } = useListSessionFilters({
    listId: "mh-siege-weapons",
    stringKeys: ["q"],
    multiKeys: [],
    urlPreserveKeys: ["object"],
  });
  const { value: urlObject, setValue: setUrlObject } =
    useListItemUrlParam("object");
  const [weapons, setWeapons] = useState<SiegeWeapon[]>([]);
  const [loading, setLoading] = useState(true);
  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);
  const [selected, setSelected] = useState<SiegeWeapon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllSiegeWeapons()
      .then(setWeapons)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!urlObject) {
      setDialogOpen(false);
      setSelected(null);
      return;
    }
    if (loading) return;
    const found = weapons.find(
      (item) => item.name.toLowerCase() === urlObject.toLowerCase(),
    );
    if (found) {
      setSelected(found);
      setDialogOpen(true);
    }
  }, [urlObject, weapons, loading]);

  const filtered = useMemo(() => {
    let result = weapons;

    if (appliedSearch.trim()) {
      const query = appliedSearch.toLowerCase();
      result = result.filter(
        (weapon) =>
          weapon.name.toLowerCase().includes(query) ||
          weapon.summary.toLowerCase().includes(query) ||
          weapon.paragraphs.some((line) => line.toLowerCase().includes(query)) ||
          weapon.immunities.some((line) => line.toLowerCase().includes(query)),
      );
    }

    return result;
  }, [weapons, appliedSearch]);

  function handleSelect(item: SiegeWeapon) {
    setSelected(item);
    setDialogOpen(true);
    setUrlObject(item.name);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Crosshair className="h-6 w-6 text-orange-400" />
          <h1 className="text-xl font-bold text-foreground">Siege Weapons</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {weapons.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Powered siege engines from Amellwind&apos;s Guide to Monster Hunting
          (Dragonator, Dragonrazer, Large Boulder), plus Dragonship blueprint and
          upgrade rules. Ballista and Cannon remain DMG references.
        </p>
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3 space-y-3">
        <DragonshipRulesPanel />
        <ClearableSearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder="Search siege weapon..."
          className="max-w-md"
          inputClassName="h-8 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <DeferredListResults
          loading={loading}
          updating={isSearchPending}
          isEmpty={filtered.length === 0}
          empty={
            <ListEmptyState icon={Crosshair} message="No siege weapons found." />
          }
        >
          <SiegeWeaponDataTable weapons={filtered} onRowClick={handleSelect} />
        </DeferredListResults>
      </div>

      {dialogOpen && selected && (
        <SiegeWeaponDetailDialog
          weapon={selected}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setUrlObject(null);
          }}
        />
      )}
    </div>
  );
}
