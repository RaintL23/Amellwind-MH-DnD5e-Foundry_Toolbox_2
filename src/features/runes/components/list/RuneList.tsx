import { useState, useEffect, useMemo } from "react";
import { Rune } from "@/shared/types";
import { getAllRunes } from "../../services/rune.service";
import { getMaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import type { MaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import { getReferencedMaterialEffectsForRune } from "@/features/material-effects/utils/material-effect-highlight.utils";
import { Pagination } from "@/components/ui/pagination";
import { RuneDetailDialog } from "../detail/RuneDetailDialog";
import { RulesPanel } from "../rules/RulesPanel";
import { ObtainMaterialsPanel } from "../rules/ObtainmentRulesPanel";
import { BuildDrawer } from "../build/BuildDrawer";
import { RuneFilters, RuneFiltersState } from "./RuneFilters";
import { RuneTable } from "./RuneTable";
import { useRuneBuild } from "../../context/RuneBuildContext";
import { Layers } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export function RuneList() {
  const [runes, setRunes] = useState<Rune[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RuneFiltersState>({
    name: "",
    monster: [],
    slot: "",
    obtainment: [],
    tag: [],
    monsterTier: [],
    materialEffectTier: [],
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Rune | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [materialEffectIndex, setMaterialEffectIndex] =
    useState<MaterialEffectNameIndex | null>(null);

  const { isInBuild, totalRunes } = useRuneBuild();

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

  const uniqueTags = useMemo(
    () => Array.from(new Set(runes.flatMap((r) => r.tags))).sort(),
    [runes],
  );

  const filtered = useMemo(() => {
    let result = runes;

    if (filters.name)
      result = result.filter((r) =>
        r.name.toLowerCase().includes(filters.name.toLowerCase()),
      );
    if (filters.monster.length > 0)
      result = result.filter((r) => filters.monster.includes(r.monsterName));
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
      result = result.filter((r) => {
        const refs = getReferencedMaterialEffectsForRune(r, materialEffectIndex);
        return filters.materialEffectTier.some((rarity) =>
          refs.some((ref) => ref.rarity === rarity),
        );
      });
    }

    return result;
  }, [runes, filters, materialEffectIndex]);

  function updateFilters(next: RuneFiltersState) {
    setFilters(next);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">
          Loading runes...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Runes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} / {runes.length} materials
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
          filters={filters}
          uniqueMonsters={uniqueMonsters}
          uniqueTags={uniqueTags}
          onChange={updateFilters}
        />

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
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />

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
