import { useState, useEffect, useMemo } from "react";
import { Rune } from "@/shared/types";
import { getAllRunes } from "../services/rune.service";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { RuneDetailDialog } from "./RuneDetailDialog";
import { Search } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

interface Filters {
  name: string;
  monster: string;
  slot: string;
  obtainment: string;
  tag: string;
}

function tagVariant(tag: string): "blue" | "orange" | "green" {
  if (tag.startsWith("class:")) return "blue";
  if (tag.startsWith("weapon-type:")) return "orange";
  return "green";
}

function formatTag(tag: string): string {
  return tag.replace(/^(class:|weapon-type:|mechanic:)/, "");
}

export function RuneList() {
  const [runes, setRunes] = useState<Rune[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    monster: "",
    slot: "",
    obtainment: "",
    tag: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Rune | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

    return result;
  }, [runes, filters]);

  // Resetear a página 1 cuando cambian los filtros
  function updateFilters(next: Filters) {
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Runes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} de {runes.length} materiales
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar material…"
            value={filters.name}
            onChange={(e) =>
              updateFilters({ ...filters, name: e.target.value })
            }
            className="pl-8"
          />
        </div>

        <Select
          value={filters.monster}
          onChange={(e) =>
            updateFilters({ ...filters, monster: e.target.value })
          }
        >
          <option value="">Todos los monstruos</option>
          {uniqueMonsters.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <Select
          value={filters.slot}
          onChange={(e) => updateFilters({ ...filters, slot: e.target.value })}
        >
          <option value="">Todos los slots</option>
          <option value="A">Armor</option>
          <option value="W">Weapon</option>
        </Select>

        <Select
          value={filters.obtainment}
          onChange={(e) =>
            updateFilters({ ...filters, obtainment: e.target.value })
          }
        >
          <option value="">Toda obtención</option>
          <option value="Carveable">Carveable</option>
          <option value="Capturable">Capturable</option>
          <option value="Ambas">Ambas</option>
        </Select>

        <Select
          value={filters.tag}
          onChange={(e) => updateFilters({ ...filters, tag: e.target.value })}
        >
          <option value="">Todos los tags</option>
          {uniqueTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Monster
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Slots
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Carve
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Capture
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((rune, i) => (
                <tr
                  key={`${rune.monsterSource}-${rune.monsterName}-${rune.name}-${i}`}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelected(rune);
                    setDialogOpen(true);
                  }}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {rune.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rune.monsterName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {rune.slots.includes("A") && (
                        <Badge variant="blue">A</Badge>
                      )}
                      {rune.slots.includes("W") && (
                        <Badge variant="orange">W</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rune.carveChance === "-" ? (
                      <span className="text-muted-foreground/40">—</span>
                    ) : (
                      rune.carveChance
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rune.captureChance === "-" ? (
                      <span className="text-muted-foreground/40">—</span>
                    ) : (
                      rune.captureChance
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rune.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant={tagVariant(tag)}
                          className="text-xs"
                        >
                          {formatTag(tag)}
                        </Badge>
                      ))}
                      {rune.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{rune.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No se encontraron materiales con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Dialog */}
      <RuneDetailDialog
        rune={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
