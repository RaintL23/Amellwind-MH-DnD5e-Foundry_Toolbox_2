import { useState, useEffect, useMemo } from "react";
import { Rune } from "@/shared/types";
import { getAllRunes } from "../services/rune.service";
import { Pagination } from "@/components/ui/pagination";
import { RuneDetailDialog } from "./RuneDetailDialog";
import { RulesPanel } from "./RulesPanel";
import { ObtainMaterialsPanel } from "./ObtainmentRulesPanel";
import { BuildDrawer } from "./BuildDrawer";
import { RuneFilters, RuneFiltersState } from "./RuneFilters";
import { RuneTable } from "./RuneTable";
import { useRuneBuild } from "../context/RuneBuildContext";
import { Layers } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

export function RuneList() {
  const [runes, setRunes] = useState<Rune[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RuneFiltersState>({
    name: "",
    monster: "",
    slot: "",
    obtainment: "",
    tag: "",
    tier: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Rune | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { isInBuild, totalRunes } = useRuneBuild();

  useEffect(() => {
    getAllRunes().then((data) => {
      setRunes(data);
      setLoading(false);
    });
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
    if (filters.monster)
      result = result.filter((r) => r.monsterName === filters.monster);
    if (filters.slot) {
      result = result.filter((r) =>
        r.slots.includes(filters.slot as "A" | "W"),
      );
    }
    if (filters.obtainment) {
      if (filters.obtainment === "Carveable")
        result = result.filter((r) => r.carveChance !== "-");
      else if (filters.obtainment === "Capturable")
        result = result.filter((r) => r.captureChance !== "-");
      else if (filters.obtainment === "Ambas")
        result = result.filter(
          (r) => r.carveChance !== "-" && r.captureChance !== "-",
        );
    }
    if (filters.tag)
      result = result.filter((r) => r.tags.includes(filters.tag));
    if (filters.tier)
      result = result.filter((r) => r.tier === Number(filters.tier));

    return result;
  }, [runes, filters]);

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
          Cargando runas…
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
              {filtered.length} of {runes.length} materials
            </p>
          </div>
          {totalRunes > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-600/10 border border-amber-600/30 px-3 py-1.5 text-xs text-amber-400 font-medium shrink-0">
              <Layers className="h-3.5 w-3.5" />
              {totalRunes} en build
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

        <RuneDetailDialog
          rune={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
      <BuildDrawer />
    </>
  );
}
