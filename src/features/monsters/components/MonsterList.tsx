import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Monster } from "@/shared/types";
import { getAllMonsters } from "../services/monster.service";
import { getTier } from "@/shared/utils/cr.utils";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { toMonsterId } from "../utils/monster-id.utils";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

type SortKey = "name" | "cr" | "tier" | "type";
type SortDir = "asc" | "desc";

interface Filters {
  name: string;
  cr: string[];
  tier: string[];
  type: string[];
  environment: string[];
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (sortKey !== col)
    return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return sortDir === "asc" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive all filter/sort/pagination state from the URL so it survives navigation
  const filters = useMemo<Filters>(
    () => ({
      name: searchParams.get("name") ?? "",
      cr: searchParams.getAll("cr"),
      tier: searchParams.getAll("tier"),
      type: searchParams.getAll("type"),
      environment: searchParams.getAll("environment"),
    }),
    [searchParams],
  );

  const sort = useMemo(
    () => ({
      key: (searchParams.get("sortKey") ?? "cr") as SortKey,
      dir: (searchParams.get("sortDir") ?? "asc") as SortDir,
    }),
    [searchParams],
  );

  const page = useMemo(
    () => parseInt(searchParams.get("page") ?? "1", 10),
    [searchParams],
  );

  const pageSize = useMemo(
    () =>
      parseInt(
        searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
        10,
      ),
    [searchParams],
  );

  // Merge a partial patch into the URL params. Uses replace:true so every
  // filter keystroke doesn't create a new history entry.
  function patchParams(
    patch: Partial<{
      name: string;
      cr: string[];
      tier: string[];
      type: string[];
      environment: string[];
      sortKey: SortKey;
      sortDir: SortDir;
      page: number;
      pageSize: number;
    }>,
  ) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();

        const name =
          "name" in patch ? (patch.name ?? "") : (prev.get("name") ?? "");
        const cr = "cr" in patch ? (patch.cr ?? []) : prev.getAll("cr");
        const tier =
          "tier" in patch ? (patch.tier ?? []) : prev.getAll("tier");
        const type =
          "type" in patch ? (patch.type ?? []) : prev.getAll("type");
        const environment =
          "environment" in patch
            ? (patch.environment ?? [])
            : prev.getAll("environment");
        const sortKey = (
          "sortKey" in patch
            ? (patch.sortKey ?? "cr")
            : (prev.get("sortKey") ?? "cr")
        ) as SortKey;
        const sortDir = (
          "sortDir" in patch
            ? (patch.sortDir ?? "asc")
            : (prev.get("sortDir") ?? "asc")
        ) as SortDir;
        const pageNum =
          "page" in patch
            ? (patch.page ?? 1)
            : parseInt(prev.get("page") ?? "1", 10);
        const pageSizeNum =
          "pageSize" in patch
            ? (patch.pageSize ?? DEFAULT_PAGE_SIZE)
            : parseInt(
                prev.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
                10,
              );

        // Only write non-default values to keep URLs clean
        if (name) next.set("name", name);
        for (const v of cr) next.append("cr", v);
        for (const v of tier) next.append("tier", v);
        for (const v of type) next.append("type", v);
        for (const v of environment) next.append("environment", v);
        if (sortKey !== "cr") next.set("sortKey", sortKey);
        if (sortDir !== "asc") next.set("sortDir", sortDir);
        if (pageNum !== 1) next.set("page", String(pageNum));
        if (pageSizeNum !== DEFAULT_PAGE_SIZE)
          next.set("pageSize", String(pageSizeNum));

        return next;
      },
      { replace: true },
    );
  }

  const handleSelect = useCallback(
    (monster: Monster) => {
      navigate(`/monsters/${toMonsterId(monster.name, monster.source)}`);
    },
    [navigate],
  );

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

  const debouncedName = useDebouncedValue(filters.name);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = monsters;

    if (debouncedName)
      result = result.filter((m) =>
        m.name.toLowerCase().includes(debouncedName.toLowerCase()),
      );
    if (filters.cr.length > 0)
      result = result.filter((m) => filters.cr.includes(m.cr));
    if (filters.tier.length > 0)
      result = result.filter((m) =>
        filters.tier.includes(String(getTier(m.cr))),
      );
    if (filters.type.length > 0)
      result = result.filter((m) => filters.type.includes(m.type.type));
    if (filters.environment.length > 0)
      result = result.filter((m) =>
        m.environment?.some((env) => filters.environment.includes(env)),
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
  }, [monsters, debouncedName, filters.cr, filters.tier, filters.type, filters.environment, sort]);

  // Resetear a página 1 cuando cambian filtros o sort
  function updateFilters(next: Filters) {
    patchParams({ ...next, page: 1 });
  }

  function toggleSort(key: SortKey) {
    patchParams({
      sortKey: key,
      sortDir:
        sort.key === key ? (sort.dir === "asc" ? "desc" : "asc") : "asc",
      page: 1,
    });
  }

  function handlePageSizeChange(size: number) {
    patchParams({ pageSize: size, page: 1 });
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    <div className="flex flex-col h-full min-h-0 p-6">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Monsters</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} / {monsters.length} monsters
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 shrink-0">
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

        <MultiSelect
          options={uniqueCRs.map((cr) => ({
            value: cr,
            label: `CR ${cr}`,
          }))}
          selected={filters.cr}
          onChange={(cr) => updateFilters({ ...filters, cr })}
          emptyLabel="All CR"
          allLabel="All CR"
          countLabel={(count) => `${count} CR`}
        />

        <MultiSelect
          options={[0, 1, 2, 3, 4].map((t) => ({
            value: String(t),
            label: `Tier ${t}`,
          }))}
          selected={filters.tier}
          onChange={(tier) => updateFilters({ ...filters, tier })}
          emptyLabel="All Tiers"
          allLabel="All Tiers"
          countLabel={(count) => `${count} tiers`}
        />

        <MultiSelect
          options={uniqueTypes.map((type) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          }))}
          selected={filters.type}
          onChange={(type) => updateFilters({ ...filters, type })}
          emptyLabel="All types"
          allLabel="All types"
          countLabel={(count) => `${count} types`}
        />

        <MultiSelect
          options={uniqueEnvironments.map((env) => ({
            value: env,
            label: env.charAt(0).toUpperCase() + env.slice(1),
          }))}
          selected={filters.environment}
          onChange={(environment) => updateFilters({ ...filters, environment })}
          emptyLabel="All environments"
          allLabel="All environments"
          countLabel={(count) => `${count} environments`}
        />
      </div>

      {/* Table — altura según contenido, con tope en el espacio disponible */}
      <div className="flex-1 min-h-0">
        <div className="max-h-full overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
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
                  className="sticky top-0 z-10 bg-muted/95 px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors backdrop-blur-sm"
                  onClick={() => toggleSort(key)}
                >
                    <span className="flex items-center gap-1">
                      {label}{" "}
                      <SortIcon col={key} sortKey={sort.key} sortDir={sort.dir} />
                    </span>
                  </th>
              ))}
              <th className="sticky top-0 z-10 bg-muted/95 px-4 py-3 text-left font-semibold text-muted-foreground backdrop-blur-sm">
                Environment
              </th>
            </tr>
          </thead>
          <tbody>
              {paginated.map((monster) => (
                <tr
                  key={`${monster.source}-${monster.name}`}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => handleSelect(monster)}
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

      <div className="shrink-0">
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={(p) => patchParams({ page: p })}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

    </div>
  );
}
