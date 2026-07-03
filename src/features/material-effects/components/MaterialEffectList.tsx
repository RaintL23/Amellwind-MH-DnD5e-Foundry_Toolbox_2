import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
import {
  appendAll,
  parsePositiveInt,
  setIfPresent,
  setIntIfNotDefault,
} from "@/shared/utils/list-url-params.utils";

const DEFAULT_PAGE_SIZE = 10;

function parseMaterialEffectListUrl(searchParams: URLSearchParams) {
  return {
    filters: {
      name: searchParams.get("q") ?? "",
      slot: searchParams.getAll("slot") as MaterialEffectFiltersState["slot"],
      rarity: searchParams.getAll("rarity") as MaterialEffectFiltersState["rarity"],
    } satisfies MaterialEffectFiltersState,
    page: parsePositiveInt(searchParams.get("page"), 1),
    pageSize: parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
  };
}

function buildMaterialEffectListUrl(
  filters: MaterialEffectFiltersState,
  page: number,
  pageSize: number,
): URLSearchParams {
  const next = new URLSearchParams();
  setIfPresent(next, "q", filters.name);
  appendAll(next, "slot", filters.slot);
  appendAll(next, "rarity", filters.rarity);
  setIntIfNotDefault(next, "page", page, 1);
  setIntIfNotDefault(next, "pageSize", pageSize, DEFAULT_PAGE_SIZE);
  return next;
}

export function MaterialEffectList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [effects, setEffects] = useState<MaterialEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MaterialEffect | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { filters, page, pageSize } = useMemo(
    () => parseMaterialEffectListUrl(searchParams),
    [searchParams],
  );

  const patchListState = useCallback(
    (
      patch: Partial<{
        filters: MaterialEffectFiltersState;
        page: number;
        pageSize: number;
      }>,
    ) => {
      setSearchParams(
        (prev) => {
          const current = parseMaterialEffectListUrl(prev);
          return buildMaterialEffectListUrl(
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
    getAllMaterialEffects()
      .then(setEffects)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = effects;

    if (filters.name.trim()) {
      const q = filters.name.toLowerCase();
      result = result.filter(
        (effect) =>
          effect.name.toLowerCase().includes(q) ||
          effect.effect.toLowerCase().includes(q),
      );
    }

    if (filters.slot.length > 0) {
      result = result.filter((effect) => filters.slot.includes(effect.slot));
    }

    if (filters.rarity.length > 0) {
      result = result.filter((effect) => filters.rarity.includes(effect.rarity));
    }

    return result;
  }, [effects, filters]);

  const updateFilters = useCallback(
    (next: MaterialEffectFiltersState) => {
      patchListState({ filters: next, page: 1 });
    },
    [patchListState],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => patchListState({ page: nextPage }),
    [patchListState],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => patchListState({ pageSize: size, page: 1 }),
    [patchListState],
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
          <h1 className="text-xl font-bold text-foreground">Material Effects</h1>
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
        <MaterialEffectFilters filters={filters} onChange={updateFilters} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm">Loading material effects...</span>
            </div>
          </div>
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
