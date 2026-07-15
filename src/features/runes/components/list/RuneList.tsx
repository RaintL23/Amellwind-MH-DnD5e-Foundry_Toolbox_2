import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Rune } from "@/shared/types";
import { parseCR } from "@/shared/utils/cr.utils";
import { getAllRunes } from "../../services/rune.service";
import { getMaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import type { MaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import { runeMatchesMaterialEffectTierFilter } from "@/features/material-effects/utils/material-effect-highlight.utils";
import { Pagination } from "@/components/ui/pagination";
import { RuneDetailDialog } from "../detail/RuneDetailDialog";
import { RulesPanel } from "../rules/RulesPanel";
import { ObtainMaterialsPanel } from "../rules/ObtainmentRulesPanel";
import { BuildDrawer } from "../build/BuildDrawer";
import { RuneFilters, type RuneFiltersState } from "./RuneFilters";
import { RuneTable } from "./RuneTable";
import { useRuneBuild } from "../../context/RuneBuildContext";
import { matchesRuneSearchQuery } from "../../utils/rune-search.utils";
import {
  buildRuneListSearchParams,
  parseRuneListUrlState,
} from "./rune-list-url.utils";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { Layers } from "lucide-react";

export function RuneList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [runes, setRunes] = useState<Rune[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Rune | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [materialEffectIndex, setMaterialEffectIndex] =
    useState<MaterialEffectNameIndex | null>(null);

  const { isInBuild, totalRunes } = useRuneBuild();

  const { filters, page, pageSize } = useMemo(
    () => parseRuneListUrlState(searchParams),
    [searchParams],
  );

  const commitName = useCallback(
    (name: string) => {
      setSearchParams(
        (prev) => {
          const current = parseRuneListUrlState(prev);
          if (current.filters.name === name) return prev;
          return buildRuneListSearchParams(
            { ...current.filters, name },
            1,
            current.pageSize,
          );
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const {
    searchDraft,
    setSearchDraft,
    appliedSearch,
    isSearchPending,
    commitSearch,
  } = useDebouncedListSearch(filters.name, commitName);

  const patchListState = useCallback(
    (
      patch: Partial<{
        filters: RuneFiltersState;
        page: number;
        pageSize: number;
      }>,
    ) => {
      setSearchParams(
        (prev) => {
          const current = parseRuneListUrlState(prev);
          return buildRuneListSearchParams(
            patch.filters ?? current.filters,
            patch.page ?? current.page,
            patch.pageSize ?? current.pageSize,
          );
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    Promise.all([getAllRunes(), getMaterialEffectNameIndex()]).then(
      ([data, index]) => {
        setRunes(data);
        setMaterialEffectIndex(index);
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
    let result = runes;

    if (appliedSearch.trim()) {
      result = result.filter((r) =>
        matchesRuneSearchQuery(r, appliedSearch, materialEffectIndex, {
          slot: filters.slot,
          tags: filters.tag,
          materialEffectTier: filters.materialEffectTier,
        }),
      );
    }
    if (filters.monster.length > 0)
      result = result.filter((r) => filters.monster.includes(r.monsterName));
    if (filters.monsterCr.length > 0) {
      result = result.filter((r) =>
        r.monsterCrs.some((cr) => filters.monsterCr.includes(cr)),
      );
    }
    if (filters.slot === "A" || filters.slot === "W") {
      const slot = filters.slot;
      result = result.filter((r) => r.slots.includes(slot));
    }
    if (filters.obtainment.length > 0) {
      result = result.filter((r) =>
        filters.obtainment.some((obtainment) => {
          if (obtainment === "Carveable") return r.carveChance !== "-";
          if (obtainment === "Capturable") return r.captureChance !== "-";
          if (obtainment === "Ambas")
            return r.carveChance !== "-" && r.captureChance !== "-";
          return false;
        }),
      );
    }
    if (filters.tag.length > 0)
      result = result.filter((r) =>
        filters.tag.some((tag) => r.tags.includes(tag)),
      );
    if (filters.monsterTier.length > 0) {
      result = result.filter((r) =>
        filters.monsterTier.includes(String(r.tier)),
      );
    }
    if (filters.materialEffectTier.length > 0 && materialEffectIndex) {
      result = result.filter((r) =>
        runeMatchesMaterialEffectTierFilter(
          r,
          materialEffectIndex,
          filters.materialEffectTier,
        ),
      );
    }

    return result;
  }, [
    runes,
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

  const isListRefreshing = loading || isSearchPending;

  const updateFilters = useCallback(
    (next: RuneFiltersState) => {
      commitSearch(next.name);
      patchListState({ filters: next, page: 1 });
    },
    [patchListState, commitSearch],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      patchListState({ page: nextPage });
    },
    [patchListState],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      patchListState({ pageSize: size, page: 1 });
    },
    [patchListState],
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
              {!isListRefreshing && (
                <>
                  {filtered.length} / {runes.length} materials
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

        {isListRefreshing ? (
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
          />
        )}
      </div>
      <BuildDrawer />
    </>
  );
}
