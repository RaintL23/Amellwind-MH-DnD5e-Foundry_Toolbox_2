import { useState, useEffect, useMemo, useCallback } from "react";
import { Rune } from "@/shared/types";
import { parseCR } from "@/shared/utils/cr.utils";
import { getAllRunes } from "../../services/rune.service";
import { getMaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import { Pagination } from "@/components/ui/pagination";
import { RuneDetailDialog } from "../detail/RuneDetailDialog";
import { RulesPanel } from "../rules/RulesPanel";
import { ObtainMaterialsPanel } from "../rules/ObtainmentRulesPanel";
import { BuildDrawer } from "../build/BuildDrawer";
import { RuneFilters, type RuneFiltersState } from "./RuneFilters";
import type { RuneSlotFilter } from "./rune-filters.utils";
import { RuneTable } from "./RuneTable";
import { useRuneBuild } from "../../context/RuneBuildContext";
import {
  buildRuneSearchIndex,
  matchesRuneSearchQuery,
  type RuneSearchIndexEntry,
} from "../../utils/rune-search.utils";
import {
  hasActiveRuneEffectListFilters,
  runeEffectMatchesListFilters,
  type RuneListEffectFilters,
} from "../../utils/rune-compatibility.utils";
import type { MaterialEffectSlot } from "@/shared/types";
import { RUNE_DEFAULT_PAGE_SIZE } from "./rune-list-url.utils";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { MhmmSourceNotice } from "@/shared/components/MhmmSourceNotice";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { parsePositiveInt } from "@/shared/utils/list-url-params.utils";
import { Layers } from "lucide-react";

export function RuneList() {
  const { q, getString, getAll, patchFilters } = useListSessionFilters({
    listId: "mh-runes",
    stringKeys: ["q", "slot", "page", "pageSize"],
    multiKeys: ["monster", "mcr", "obtain", "tag", "mtier", "etier"],
  });
  const [runes, setRunes] = useState<Rune[]>([]);
  const [searchIndex, setSearchIndex] = useState<RuneSearchIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Rune | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [materialEffectIndex, setMaterialEffectIndex] =
    useState<MaterialEffectNameIndex | null>(null);

  const { isInBuild, totalRunes } = useRuneBuild();

  const filters = useMemo<RuneFiltersState>(
    () => ({
      name: q,
      monster: getAll("monster"),
      monsterCr: getAll("mcr"),
      slot: (getString("slot") || "") as RuneSlotFilter,
      obtainment: getAll("obtain"),
      tag: getAll("tag"),
      monsterTier: getAll("mtier"),
      materialEffectTier: getAll("etier"),
    }),
    [q, getString, getAll],
  );

  const page = parsePositiveInt(getString("page") || null, 1);
  const pageSize = parsePositiveInt(
    getString("pageSize") || null,
    RUNE_DEFAULT_PAGE_SIZE,
  );

  const commitName = useCallback(
    (name: string) => {
      patchFilters({ q: name, page: "1" });
    },
    [patchFilters],
  );

  const {
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    commitSearch,
  } = useDebouncedListSearch(q, commitName);

  useEffect(() => {
    Promise.all([getAllRunes(), getMaterialEffectNameIndex()]).then(
      ([data, index]) => {
        setRunes(data);
        setMaterialEffectIndex(index);
        setSearchIndex(buildRuneSearchIndex(data, index));
        setLoading(false);
      },
    );
  }, []);

  const uniqueMonsters = useMemo(
    () => Array.from(new Set(runes.map((r) => r.monsterName))).sort(),
    [runes],
  );

  const uniqueMonsterCrs = useMemo(
    () =>
      Array.from(
        new Set(runes.flatMap((r) => r.monsterCrs).filter(Boolean)),
      ).sort((a, b) => parseCR(a) - parseCR(b)),
    [runes],
  );

  const uniqueTags = useMemo(
    () => Array.from(new Set(runes.flatMap((r) => r.tags))).sort(),
    [runes],
  );

  const filtered = useMemo(() => {
    const searchContext = {
      slot: filters.slot,
      tags: filters.tag,
      materialEffectTier: filters.materialEffectTier,
    };
    let result = searchIndex;

    if (appliedSearch.trim()) {
      result = result.filter((entry) =>
        matchesRuneSearchQuery(entry, appliedSearch, searchContext),
      );
    }
    if (filters.monster.length > 0)
      result = result.filter((entry) =>
        filters.monster.includes(entry.rune.monsterName),
      );
    if (filters.monsterCr.length > 0) {
      result = result.filter((entry) =>
        entry.rune.monsterCrs.some((cr) => filters.monsterCr.includes(cr)),
      );
    }
    if (filters.obtainment.length > 0) {
      result = result.filter((entry) =>
        filters.obtainment.some((obtainment) => {
          if (obtainment === "Carveable") return entry.rune.carveChance !== "-";
          if (obtainment === "Capturable")
            return entry.rune.captureChance !== "-";
          if (obtainment === "Both" || obtainment === "Ambas")
            return (
              entry.rune.carveChance !== "-" && entry.rune.captureChance !== "-"
            );
          return false;
        }),
      );
    }
    if (filters.monsterTier.length > 0) {
      result = result.filter((entry) =>
        filters.monsterTier.includes(String(entry.rune.tier)),
      );
    }

    const effectFilters: RuneListEffectFilters = {
      slot: filters.slot,
      tag: filters.tag,
      materialEffectTier: filters.materialEffectTier,
    };
    if (hasActiveRuneEffectListFilters(effectFilters)) {
      result = result.filter((entry) =>
        (["weapon", "armor"] as MaterialEffectSlot[]).some((kind) =>
          runeEffectMatchesListFilters(
            entry.rune,
            kind,
            effectFilters,
            materialEffectIndex,
          ),
        ),
      );
    }

    return result.map((entry) => entry.rune);
  }, [
    searchIndex,
    appliedSearch,
    filters.monster,
    filters.monsterCr,
    filters.slot,
    filters.obtainment,
    filters.tag,
    filters.monsterTier,
    filters.materialEffectTier,
    materialEffectIndex,
  ]);

  const updateFilters = useCallback(
    (next: RuneFiltersState) => {
      commitSearch(next.name);
      patchFilters({
        q: next.name,
        monster: next.monster,
        mcr: next.monsterCr,
        slot: next.slot,
        obtain: next.obtainment,
        tag: next.tag,
        mtier: next.monsterTier,
        etier: next.materialEffectTier,
        page: "1",
      });
    },
    [patchFilters, commitSearch],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      patchFilters({ page: String(nextPage) });
    },
    [patchFilters],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      patchFilters({ pageSize: String(size), page: "1" });
    },
    [patchFilters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Runes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {!loading && (
                <>
                  {isSearchPending
                    ? "Updating…"
                    : `${filtered.length} / ${runes.length} materials`}
                </>
              )}
            </p>
          </div>
          {totalRunes > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-600/10 border border-amber-600/30 px-3 py-1.5 text-xs text-amber-400 font-medium shrink-0">
              <Layers className="h-3.5 w-3.5" />
              {totalRunes} in your build
            </div>
          )}
        </div>

        <MhmmSourceNotice className="mb-4" />

        <ObtainMaterialsPanel />
        <RulesPanel />

        <RuneFilters
          filters={{ ...filters, name: searchDraft }}
          uniqueMonsters={uniqueMonsters}
          uniqueMonsterCrs={uniqueMonsterCrs}
          uniqueTags={uniqueTags}
          onSearchChange={setSearchDraft}
          onChange={updateFilters}
        />

        {loading ? (
          <ListAreaLoading />
        ) : (
          <>
            <RuneTable
              runes={paginated}
              totalFiltered={filtered.length}
              isInBuild={isInBuild}
              onSelect={(rune) => {
                setSelected(rune);
                setDialogOpen(true);
              }}
            />

            <Pagination
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}

        {dialogOpen && selected && (
          <RuneDetailDialog
            rune={selected}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            materialEffectIndex={materialEffectIndex}
            effectFilters={{
              slot: filters.slot,
              tag: filters.tag,
              materialEffectTier: filters.materialEffectTier,
            }}
            filteredRunes={filtered}
            onNavigate={setSelected}
          />
        )}
      </div>
      <BuildDrawer />
    </>
  );
}
