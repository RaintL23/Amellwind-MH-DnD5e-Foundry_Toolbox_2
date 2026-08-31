import { useState, useEffect, useMemo, useCallback } from "react";
import type { ColumnFiltersState, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Rune } from "@/shared/types";
import { parseCR } from "@/shared/utils/cr.utils";
import { getAllRunes } from "../../services/rune.service";
import { getMaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import { getMaterialEffectNamesFromRunes } from "@/features/amellwind/material-effects/utils/material-effect-highlight.utils";
import { RuneDetailDialog } from "../detail/RuneDetailDialog";
import { RulesPanel } from "../rules/RulesPanel";
import { ObtainMaterialsPanel } from "../rules/ObtainmentRulesPanel";
import { BuildDrawer } from "../build/BuildDrawer";
import { RuneFilters, type RuneFiltersState } from "./RuneFilters";
import type { RuneSlotFilter } from "./rune-filters.utils";
import { RuneDataTable } from "./RuneDataTable";
import { useRuneBuild } from "../../context/RuneBuildContext";
import { buildRuneSearchIndex } from "../../utils/rune-search.utils";
import { RUNE_DEFAULT_PAGE_SIZE } from "./rune-list-url.utils";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { MhmmSourceNotice } from "@/shared/components/MhmmSourceNotice";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { parsePositiveInt } from "@/shared/utils/list-url-params.utils";
import { Layers } from "lucide-react";
import {
  buildRuneColumnFilters,
  matchesRuneListRow,
  payloadFromRuneFilters,
  type RuneListRow,
} from "./rune-table-filters.utils";

function sortingFromSession(
  sortId: string,
  sortDesc: string,
): SortingState {
  if (!sortId) return [];
  return [{ id: sortId, desc: sortDesc === "true" }];
}

export function RuneList() {
  const { q, getString, getAll, patchFilters } = useListSessionFilters({
    listId: "mh-runes",
    stringKeys: ["q", "slot", "page", "pageSize", "sortId", "sortDesc"],
    multiKeys: ["monster", "mcr", "obtain", "tag", "mtier", "etier", "meffect"],
  });
  const [runes, setRunes] = useState<Rune[]>([]);
  const [searchIndex, setSearchIndex] = useState<RuneListRow[]>([]);
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
      materialEffect: getAll("meffect"),
    }),
    [q, getString, getAll],
  );

  const page = parsePositiveInt(getString("page") || null, 1);
  const pageSize = parsePositiveInt(
    getString("pageSize") || null,
    RUNE_DEFAULT_PAGE_SIZE,
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    buildRuneColumnFilters(filters),
  );
  const [sorting, setSorting] = useState<SortingState>(() =>
    sortingFromSession(getString("sortId") || "", getString("sortDesc") || ""),
  );
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: page - 1,
    pageSize,
  }));

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

  useEffect(() => {
    setColumnFilters(buildRuneColumnFilters({ ...filters, name: appliedSearch }));
  }, [
    appliedSearch,
    filters.monster,
    filters.monsterCr,
    filters.slot,
    filters.obtainment,
    filters.tag,
    filters.monsterTier,
    filters.materialEffectTier,
    filters.materialEffect,
  ]);

  useEffect(() => {
    setPagination({ pageIndex: page - 1, pageSize });
  }, [page, pageSize]);

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

  const uniqueMaterialEffects = useMemo(
    () =>
      materialEffectIndex
        ? getMaterialEffectNamesFromRunes(runes, materialEffectIndex)
        : [],
    [runes, materialEffectIndex],
  );

  const filterPayload = useMemo(
    () => payloadFromRuneFilters({ ...filters, name: appliedSearch }),
    [filters, appliedSearch],
  );

  const filteredRunes = useMemo(
    () =>
      searchIndex
        .filter((row) =>
          matchesRuneListRow(row, filterPayload, materialEffectIndex),
        )
        .map((row) => row.rune),
    [searchIndex, filterPayload, materialEffectIndex],
  );

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
        meffect: next.materialEffect,
        page: "1",
      });
    },
    [patchFilters, commitSearch],
  );

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const primary = next[0];
        patchFilters({
          sortId: primary?.id ?? "",
          sortDesc: primary?.desc ? "true" : "false",
          page: "1",
        });
        return next;
      });
    },
    [patchFilters],
  );

  const handlePaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      setPagination((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        patchFilters({
          page: String(next.pageIndex + 1),
          pageSize: String(next.pageSize),
        });
        return next;
      });
    },
    [patchFilters],
  );

  const effectFilters = useMemo(
    () => ({
      slot: filters.slot,
      tag: filters.tag,
      materialEffectTier: filters.materialEffectTier,
      materialEffectName: filters.materialEffect,
    }),
    [
      filters.slot,
      filters.tag,
      filters.materialEffectTier,
      filters.materialEffect,
    ],
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
                    : `${filteredRunes.length} / ${runes.length} materials`}
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
          uniqueMaterialEffects={uniqueMaterialEffects}
          onSearchChange={setSearchDraft}
          onChange={updateFilters}
        />

        {loading ? (
          <ListAreaLoading />
        ) : (
          <RuneDataTable
            rows={searchIndex}
            materialEffectIndex={materialEffectIndex}
            isInBuild={isInBuild}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            onSelect={(rune) => {
              setSelected(rune);
              setDialogOpen(true);
            }}
          />
        )}

        {dialogOpen && selected && (
          <RuneDetailDialog
            rune={selected}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            materialEffectIndex={materialEffectIndex}
            effectFilters={{
              slot: effectFilters.slot,
              tag: effectFilters.tag,
              materialEffectTier: effectFilters.materialEffectTier,
              materialEffectName: effectFilters.materialEffectName,
            }}
            filteredRunes={filteredRunes}
            onNavigate={setSelected}
          />
        )}
      </div>
      <BuildDrawer />
    </>
  );
}
