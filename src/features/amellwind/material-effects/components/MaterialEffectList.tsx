import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { MaterialEffect } from "@/shared/types";
import { Pagination } from "@/components/ui/pagination";
import { Sparkles } from "lucide-react";
import { getAllMaterialEffects } from "../services/material-effect.service";
import {
  MATERIAL_EFFECT_INTRO,
  type MaterialEffectFiltersState,
} from "../constants/material-effect.constants";
import { MaterialEffectFilters } from "./MaterialEffectFilters";
import { MaterialEffectCard } from "./MaterialEffectCard";
import { MaterialEffectDetailDialog } from "./MaterialEffectDetailDialog";
import { parsePositiveInt } from "@/shared/utils/list-url-params.utils";

const DEFAULT_PAGE_SIZE = 20;

export function MaterialEffectList() {
  const { q, getString, getAll, patchFilters } = useListSessionFilters({
    listId: "mh-material-effects",
    stringKeys: ["q", "page", "pageSize"],
    multiKeys: ["slot", "rarity"],
  });
  const [effects, setEffects] = useState<MaterialEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MaterialEffect | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filters = useMemo<MaterialEffectFiltersState>(
    () => ({
      name: q,
      slot: getAll("slot") as MaterialEffectFiltersState["slot"],
      rarity: getAll("rarity") as MaterialEffectFiltersState["rarity"],
    }),
    [q, getAll],
  );

  const page = parsePositiveInt(getString("page") || null, 1);
  const pageSize = parsePositiveInt(
    getString("pageSize") || null,
    DEFAULT_PAGE_SIZE,
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
    getAllMaterialEffects()
      .then(setEffects)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = effects;

    if (appliedSearch.trim()) {
      const query = appliedSearch.toLowerCase();
      result = result.filter(
        (effect) =>
          effect.name.toLowerCase().includes(query) ||
          effect.effect.toLowerCase().includes(query),
      );
    }

    if (filters.slot.length > 0) {
      result = result.filter((effect) => filters.slot.includes(effect.slot));
    }

    if (filters.rarity.length > 0) {
      result = result.filter((effect) =>
        filters.rarity.includes(effect.rarity),
      );
    }

    return result;
  }, [effects, appliedSearch, filters.slot, filters.rarity]);

  const updateFilters = useCallback(
    (next: MaterialEffectFiltersState) => {
      commitSearch(next.name);
      patchFilters({
        q: next.name,
        slot: next.slot,
        rarity: next.rarity,
        page: "1",
      });
    },
    [patchFilters, commitSearch],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => patchFilters({ page: String(nextPage) }),
    [patchFilters],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => patchFilters({ pageSize: String(size), page: "1" }),
    [patchFilters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const weaponCount = effects.filter((e) => e.slot === "weapon").length;
  const armorCount = effects.filter((e) => e.slot === "armor").length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-foreground">
            Material Effects
          </h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {effects.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {MATERIAL_EFFECT_INTRO}
        </p>
        {!loading && (
          <p className="text-xs text-muted-foreground mt-2">
            {weaponCount} weapon · {armorCount} armor effects
          </p>
        )}
      </div>

      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <MaterialEffectFilters
          filters={{ ...filters, name: searchDraft }}
          onSearchChange={setSearchDraft}
          onChange={updateFilters}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading || isSearchPending ? (
          <ListAreaLoading variant="cards" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Sparkles className="h-10 w-10 opacity-20" />
            <p className="text-sm">No material effects match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map((effect) => (
                <MaterialEffectCard
                  key={effect.id}
                  effect={effect}
                  onClick={() => {
                    setSelected(effect);
                    setDialogOpen(true);
                  }}
                />
              ))}
            </div>

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
      </div>

      {dialogOpen && selected && (
        <MaterialEffectDetailDialog
          effect={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
