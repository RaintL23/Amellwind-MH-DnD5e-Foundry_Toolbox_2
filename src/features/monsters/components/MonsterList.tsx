import { useState, useEffect, useMemo } from "react";
import { Monster } from "@/shared/types";
import { getAllMonsters } from "../services/monster.service";
import { getTier } from "@/shared/utils/cr.utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { MonsterDetailDialog } from "./MonsterDetailDialog";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

type SortKey = "name" | "cr" | "tier" | "type";
type SortDir = "asc" | "desc";

interface Filters {
  name: string;
  cr: string;
  tier: string;
  type: string;
  environment: string;
}

function TierBadge({ tier }: { tier: number }) {
  const colors: Record<number, string> = {
    0: "bg-gray-700 text-gray-300 border border-gray-600",
    1: "bg-green-900/40 text-green-300 border border-green-700",
    2: "bg-blue-900/40 text-blue-300 border border-blue-700",
    3: "bg-purple-900/40 text-purple-300 border border-purple-700",
    4: "bg-amber-900/40 text-amber-300 border border-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[tier] ?? colors[0]}`}
    >
      T{tier}
    </span>
  );
}

export function MonsterList() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    cr: "",
    tier: "",
    type: "",
    environment: "",
  });
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "cr",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Monster | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllMonsters().then((data) => {
      setMonsters(data);
      setLoading(false);
    });
  }, []);

  // Unique values for selects
  const uniqueCRs = useMemo(() => {
    const set = new Set(monsters.map((m) => m.cr));
    return Array.from(set).sort((a, b) => {
      const toNum = (s: string) =>
        s.includes("/")
          ? parseInt(s.split("/")[0]) / parseInt(s.split("/")[1])
          : Number(s);
      return toNum(a) - toNum(b);
    });
  }, [monsters]);

  const uniqueTypes = useMemo(
    () => Array.from(new Set(monsters.map((m) => m.type.type))).sort(),
    [monsters],
  );

  const uniqueEnvironments = useMemo(() => {
    const set = new Set(monsters.flatMap((m) => m.environment ?? []));
    return Array.from(set).sort();
  }, [monsters]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = monsters;

    if (filters.name)
      result = result.filter((m) =>
        m.name.toLowerCase().includes(filters.name.toLowerCase()),
      );
    if (filters.cr) result = result.filter((m) => m.cr === filters.cr);
    if (filters.tier)
      result = result.filter((m) => getTier(m.cr) === Number(filters.tier));
    if (filters.type)
      result = result.filter((m) => m.type.type === filters.type);
    if (filters.environment)
      result = result.filter((m) =>
        m.environment?.includes(filters.environment),
      );

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sort.key === "name") cmp = a.name.localeCompare(b.name);
      else if (sort.key === "cr" || sort.key === "tier") {
        const toNum = (s: string) =>
          s.includes("/")
            ? parseInt(s.split("/")[0]) / parseInt(s.split("/")[1])
            : Number(s);
        cmp = toNum(a.cr) - toNum(b.cr);
      } else if (sort.key === "type")
        cmp = a.type.type.localeCompare(b.type.type);
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [monsters, filters, sort]);

  // Resetear a página 1 cuando cambian filtros o sort
  function updateFilters(next: Filters) {
    setFilters(next);
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col)
      return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sort.dir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">
          Loading monsters...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Monsters</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} / {monsters.length} monsters
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) =>
              updateFilters({ ...filters, name: e.target.value })
            }
            className="pl-8"
          />
        </div>

        <Select
          value={filters.cr}
          onChange={(e) => updateFilters({ ...filters, cr: e.target.value })}
        >
          <option value="">All CR</option>
          {uniqueCRs.map((cr) => (
            <option key={cr} value={cr}>
              CR {cr}
            </option>
          ))}
        </Select>

        <Select
          value={filters.tier}
          onChange={(e) => updateFilters({ ...filters, tier: e.target.value })}
        >
          <option value="">All Tiers</option>
          {[0, 1, 2, 3, 4].map((t) => (
            <option key={t} value={t}>
              Tier {t}
            </option>
          ))}
        </Select>

        <Select
          value={filters.type}
          onChange={(e) => updateFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type} className="capitalize">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </Select>

        <Select
          value={filters.environment}
          onChange={(e) =>
            updateFilters({ ...filters, environment: e.target.value })
          }
        >
          <option value="">All environments</option>
          {uniqueEnvironments.map((env) => (
            <option key={env} value={env} className="capitalize">
              {env.charAt(0).toUpperCase() + env.slice(1)}
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
                {(
                  [
                    { key: "name", label: "Name" },
                    { key: "cr", label: "CR" },
                    { key: "tier", label: "Tier" },
                    { key: "type", label: "Type" },
                  ] as Array<{ key: SortKey; label: string }>
                ).map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Environment
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((monster) => (
                <tr
                  key={`${monster.source}-${monster.name}`}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelected(monster);
                    setDialogOpen(true);
                  }}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {monster.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {monster.cr}
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={getTier(monster.cr)} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {monster.type.type.charAt(0).toUpperCase() +
                      monster.type.type.slice(1)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(monster.environment ?? []).slice(0, 3).map((env) => (
                        <Badge
                          key={env}
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {env}
                        </Badge>
                      ))}
                      {(monster.environment?.length ?? 0) > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(monster.environment?.length ?? 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No monsters found with the applied filters.
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
      <MonsterDetailDialog
        monster={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
