import { useState, useMemo } from "react";
import {
  getAllComboTables,
  searchAllComboRows,
  filterRows,
  SearchResult,
} from "../services/combo.service";
import { COMBO_RULES } from "../data/combo.data";
import { ComboRow } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import {
  Hammer,
  BookOpen,
  Search,
  FlaskConical,
  Leaf,
  Wrench,
  Utensils,
  Skull,
  Gem,
  X,
  BookMarked,
} from "lucide-react";

type ActiveTab = "rules" | string;

// ── Colores por categoría ──────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  string,
  { badge: string; row: string }
> = {
  HEALING: {
    badge: "bg-green-900/40 text-green-300 border border-green-700/40",
    row: "bg-green-900/10",
  },
  BUFFS: {
    badge: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
    row: "bg-blue-900/10",
  },
  COATINGS: {
    badge: "bg-purple-900/40 text-purple-300 border border-purple-700/40",
    row: "bg-purple-900/10",
  },
  "DR AMMO": {
    badge: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
    row: "bg-orange-900/10",
  },
  "Bowgun Ammo": {
    badge: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
    row: "bg-orange-900/10",
  },
  "Light Bowgun only ammo": {
    badge: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
    row: "bg-yellow-900/10",
  },
  "Heavy Bowgun only ammo": {
    badge: "bg-red-900/40 text-red-300 border border-red-700/40",
    row: "bg-red-900/10",
  },
  HORNS: {
    badge: "bg-teal-900/40 text-teal-300 border border-teal-700/40",
    row: "bg-teal-900/10",
  },
  BOMBS: {
    badge: "bg-amber-900/40 text-amber-300 border border-amber-700/40",
    row: "bg-amber-900/10",
  },
  "BARREL BOMBS": {
    badge: "bg-red-900/40 text-red-300 border border-red-700/40",
    row: "bg-red-900/10",
  },
  TRAPS: {
    badge: "bg-cyan-900/40 text-cyan-300 border border-cyan-700/40",
    row: "bg-cyan-900/10",
  },
  LURES: {
    badge: "bg-sky-900/40 text-sky-300 border border-sky-700/40",
    row: "bg-sky-900/10",
  },
};

function getCategoryStyle(cat: string) {
  return (
    CATEGORY_STYLES[cat] ?? {
      badge: "bg-muted text-muted-foreground border border-border",
      row: "",
    }
  );
}

// ── Icono por tool ─────────────────────────────────────────────────────────

const TOOL_ICONS: Record<string, React.ElementType> = {
  alchemist: FlaskConical,
  brewer: Gem,
  cook: Utensils,
  glassblower: Gem,
  herbalism: Leaf,
  poisoner: Skull,
  smith: Hammer,
  tinker: Wrench,
  woodcarver: Leaf,
};

// ── Componente principal ──────────────────────────────────────────────────

export function ComboPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("rules");
  const [search, setSearch] = useState("");

  const tables = getAllComboTables();
  const searchResults = useMemo(
    () => (search.trim() ? searchAllComboRows(search) : []),
    [search],
  );
  const isSearching = search.trim().length > 0;

  const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "rules", label: "Reglas", icon: BookOpen },
    ...tables.map((t) => ({
      id: t.id,
      label: t.toolName,
      icon: TOOL_ICONS[t.id] ?? Wrench,
    })),
  ];

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearch("");
  };

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Hammer className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Combo List</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Sistema de crafteo: combina ingredientes con las herramientas
          adecuadas para crear objetos útiles.
        </p>
      </div>

      {/* Search bar global */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, ingrediente o categoría…"
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── MODO BÚSQUEDA ── */}
      {isSearching ? (
        <SearchResultsPanel results={searchResults} query={search} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-6 border-b border-border pb-3">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === id
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[120px]">{label}</span>
              </button>
            ))}
          </div>

          {/* ── REGLAS ── */}
          {activeTab === "rules" && <RulesTab tables={tables} onTabChange={handleTabChange} />}

          {/* ── TOOL TABS ── */}
          {tables.map((table) => {
            if (activeTab !== table.id) return null;
            return (
              <ToolTab key={table.id} tableId={table.id} />
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Rules Tab ─────────────────────────────────────────────────────────────

function RulesTab({
  tables,
  onTabChange,
}: {
  tables: ReturnType<typeof getAllComboTables>;
  onTabChange: (id: string) => void;
}) {
  const regular = COMBO_RULES.filter((r) => !r.isInset);
  const inset = COMBO_RULES.find((r) => r.isInset);

  return (
    <div className="space-y-5">
      {/* Reglas cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {regular.map((rule) => (
          <div
            key={rule.name}
            className="rounded-lg border border-border bg-card p-4"
          >
            <h3 className="font-semibold text-foreground mb-2">{rule.name}</h3>
            <div className="space-y-2">
              {rule.content.map((line, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Combo Books inset */}
      {inset && (
        <div className="rounded-lg border-2 border-amber-700/50 bg-amber-900/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-amber-300 text-lg">{inset.name}</h3>
          </div>
          <div className="space-y-2">
            {inset.content.map((line, i) => (
              <p key={i} className="text-sm text-amber-100/80 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de herramientas */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-3">
          Herramientas disponibles
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {tables.map((t) => {
            const Icon = TOOL_ICONS[t.id] ?? Wrench;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-colors text-center cursor-pointer"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-foreground leading-tight">
                  {t.toolName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.rows.length} recetas
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tool Tab ──────────────────────────────────────────────────────────────

function ToolTab({ tableId }: { tableId: string }) {
  const [localSearch, setLocalSearch] = useState("");
  const table = getAllComboTables().find((t) => t.id === tableId);
  if (!table) return null;

  const filtered = filterRows(table.rows, localSearch);

  return (
    <div>
      {/* Tool header */}
      <div className="rounded-lg border border-border bg-card p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="font-bold text-lg text-foreground">{table.toolName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {table.rows.length} recetas disponibles ·{" "}
            {getUniqueCategories(table.rows).length > 0
              ? `Categorías: ${getUniqueCategories(table.rows).join(", ")}`
              : "Sin subcategorías"}
          </p>
        </div>
        {/* Local search */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filtrar recetas…"
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {table.hasCategory && (
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap w-28">
                    Categoría
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Objeto
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Ingrediente 1
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Ingrediente 2
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground w-14">
                  DC
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground w-16">
                  Cant.
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.hasCategory ? 6 : 5}
                    className="px-4 py-8 text-center text-muted-foreground text-sm"
                  >
                    No se encontraron recetas con ese filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <CraftRow key={i} row={row} hasCategory={table.hasCategory} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Craft Row ─────────────────────────────────────────────────────────────

function CraftRow({ row, hasCategory }: { row: ComboRow; hasCategory: boolean }) {
  const catStyle = row.category ? getCategoryStyle(row.category) : null;

  return (
    <tr
      className={cn(
        "border-b border-border/50 transition-colors hover:bg-muted/30",
        catStyle?.row ?? "",
      )}
    >
      {hasCategory && (
        <td className="px-3 py-3">
          {row.category ? (
            <span
              className={cn(
                "inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap",
                catStyle?.badge,
              )}
            >
              {row.category}
            </span>
          ) : null}
        </td>
      )}
      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{row.item1}</td>
      <td className="px-4 py-3 text-muted-foreground">{row.item2 || "—"}</td>
      <td className="px-3 py-3 text-center">
        {row.dc ? (
          <Badge variant="default" className="font-mono text-xs">
            {row.dc}
          </Badge>
        ) : null}
      </td>
      <td className="px-3 py-3 text-center">
        {row.quantity ? (
          <span className="text-xs font-semibold text-foreground font-mono">
            {row.quantity}
          </span>
        ) : (
          <span className="text-muted-foreground/50 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Search Results Panel ──────────────────────────────────────────────────

function SearchResultsPanel({
  results,
  query,
}: {
  results: SearchResult[];
  query: string;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground font-medium">Sin resultados</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          No se encontraron recetas para &quot;{query}&quot;
        </p>
      </div>
    );
  }

  // Group by tool
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.toolId]) acc[r.toolId] = [];
    acc[r.toolId].push(r);
    return acc;
  }, {});

  const toolOrder = getAllComboTables().map((t) => t.id);
  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => toolOrder.indexOf(a) - toolOrder.indexOf(b),
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado
        {results.length !== 1 ? "s" : ""} en {sortedGroups.length} herramienta
        {sortedGroups.length !== 1 ? "s" : ""}.
      </p>
      {sortedGroups.map(([toolId, groupResults]) => {
        const toolName = groupResults[0].toolName;
        const Icon = TOOL_ICONS[toolId] ?? Wrench;
        const table = getAllComboTables().find((t) => t.id === toolId);
        const hasCategory = table?.hasCategory ?? false;

        return (
          <div key={toolId} className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                {toolName}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {groupResults.length} resultado{groupResults.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    {hasCategory && (
                      <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-28 text-xs">
                        Categoría
                      </th>
                    )}
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                      Objeto
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                      Ingrediente 1
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs">
                      Ingrediente 2
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground w-14 text-xs">
                      DC
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground w-16 text-xs">
                      Cant.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupResults.map(({ row }, i) => (
                    <CraftRow key={i} row={row} hasCategory={hasCategory} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getUniqueCategories(rows: ComboRow[]): string[] {
  const cats = new Set<string>();
  for (const row of rows) {
    if (row.category) cats.add(row.category);
  }
  return Array.from(cats);
}
