import { useEffect, useMemo, useState } from "react";
import { Weapon, DMG_TYPE_LABELS, PROPERTY_LABELS } from "@/shared/types";
import { getAllWeapons } from "../services/weapon.service";
import { WeaponCard } from "./WeaponCard";
import { WeaponDialog } from "./WeaponDialog";
import { Input } from "@/components/ui/input";
import { Search, Swords } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const DMG_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "S", label: "Slashing" },
  { value: "P", label: "Piercing" },
  { value: "B", label: "Bludgeoning" },
];

const PROPERTY_FILTER_OPTIONS = [
  { value: "", label: "All Properties" },
  ...Object.entries(PROPERTY_LABELS).map(([k, v]) => ({ value: k, label: v })),
];

export function WeaponList() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dmgFilter, setDmgFilter] = useState("");
  const [propFilter, setPropFilter] = useState("");
  const [selected, setSelected] = useState<Weapon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getAllWeapons()
      .then(setWeapons)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = weapons;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }
    if (dmgFilter) {
      result = result.filter((w) => w.dmgType === dmgFilter);
    }
    if (propFilter) {
      result = result.filter((w) => w.properties.includes(propFilter));
    }
    return result;
  }, [weapons, search, dmgFilter, propFilter]);

  function handleSelect(weapon: Weapon) {
    setSelected(weapon);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Hunter Weapons</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {filtered.length} / {weapons.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Las 14 armas de Monster Hunter adaptadas al sistema D&D 5e. Cada una escala de Común a Legendaria.
        </p>
      </div>

      {/* Filters */}
      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar arma..."
              className="pl-9 h-8 text-sm"
            />
          </div>

          {/* Damage type filter */}
          <div className="flex items-center gap-1">
            {DMG_FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDmgFilter(value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  dmgFilter === value
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {value ? DMG_TYPE_LABELS[value] : label}
              </button>
            ))}
          </div>

          {/* Property filter */}
          <select
            value={propFilter}
            onChange={(e) => setPropFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PROPERTY_FILTER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {(search || dmgFilter || propFilter) && (
            <button
              onClick={() => { setSearch(""); setDmgFilter(""); setPropFilter(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Cargando armas...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Swords className="h-10 w-10 opacity-20" />
            <p className="text-sm">No se encontraron armas con esos filtros.</p>
            <button
              onClick={() => { setSearch(""); setDmgFilter(""); setPropFilter(""); }}
              className="text-xs underline underline-offset-2 hover:text-foreground"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((weapon) => (
              <WeaponCard
                key={weapon.name}
                weapon={weapon}
                onClick={() => handleSelect(weapon)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <WeaponDialog
        weapon={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
