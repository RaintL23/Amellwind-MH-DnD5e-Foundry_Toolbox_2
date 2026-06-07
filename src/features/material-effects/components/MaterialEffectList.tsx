import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_PAGE_SIZE = 24;

export function MaterialEffectList() {
  const [effects, setEffects] = useState<MaterialEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MaterialEffectFiltersState>({
    name: "",
    slot: [],
    rarity: [],
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<MaterialEffect | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  function updateFilters(next: MaterialEffectFiltersState) {
    setFilters(next);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
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
