import { useCallback, useMemo, useRef, useState } from "react";
import {
  Download,
  GitCompare,
  Hammer,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useWeaponForge } from "../hooks/useWeaponForge";
import type {
  CustomWeapon,
  WeaponForgeFormValues,
} from "../types/weapon-forge.types";
import { weaponToFormValues } from "../types/weapon-forge.types";
import { WeaponForgeCard } from "./WeaponForgeCard";
import { WeaponForgeDialog } from "./WeaponForgeDialog";
import { WeaponForgeForm } from "./WeaponForgeForm";
import { WeaponComparePanel } from "./WeaponComparePanel";

export function WeaponForgeList() {
  const {
    curated,
    userWeapons,
    amellwindWeapons,
    loading,
    saveFromForm,
    removeWeapon,
    importFromJson,
    exportOne,
    exportAll,
    compareSelection,
    toggleCompare,
    clearCompare,
    resolveCompareWeapons,
  } = useWeaponForge();

  const [tab, setTab] = useState<"catalog" | "mine">("mine");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [selected, setSelected] = useState<CustomWeapon | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomWeapon | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterList = useCallback(
    (list: CustomWeapon[]) => {
      const q = debouncedSearch.trim().toLowerCase();
      if (!q) return list;
      return list.filter((w) => w.name.toLowerCase().includes(q));
    },
    [debouncedSearch],
  );

  const filteredCurated = useMemo(
    () => filterList(curated),
    [curated, filterList],
  );
  const filteredUser = useMemo(
    () => filterList(userWeapons),
    [userWeapons, filterList],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(weapon: CustomWeapon) {
    setEditing(weapon);
    setFormOpen(true);
  }

  function openDetail(weapon: CustomWeapon) {
    if (compareMode) {
      toggleCompare(weapon.id);
      return;
    }
    setSelected(weapon);
    setDetailOpen(true);
  }

  function handleSave(values: WeaponForgeFormValues, existing?: CustomWeapon) {
    const saved = saveFromForm(values, existing);
    setSelected(saved);
  }

  function handleDelete(weapon: CustomWeapon) {
    if (!window.confirm(`Delete "${weapon.name}"? This cannot be undone.`)) {
      return;
    }
    removeWeapon(weapon.id);
    if (selected?.id === weapon.id) {
      setDetailOpen(false);
      setSelected(null);
    }
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);
      importFromJson(data);
      setTab("mine");
    } catch {
      window.alert("Could not parse that JSON file.");
    }
  }

  function addAmellwindToCompare(name: string) {
    const key = `aw:${name}`;
    toggleCompare(key);
  }

  const compareWeapons = resolveCompareWeapons();

  // Allow cloning a curated weapon into user list for editing
  function cloneToMine(weapon: CustomWeapon) {
    const values = weaponToFormValues(weapon);
    values.name = `${weapon.name} (Custom)`;
    saveFromForm(values, undefined);
    setTab("mine");
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Hammer className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                MH Weapons — Amellwind Format by RaintDM
              </h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Create and tweak Monster Hunter weapons using Amellwind&apos;s
              format for your own tables. Curated catalog ships with the app;
              your custom weapons stay in this browser until you export JSON.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New weapon
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant={compareMode ? "default" : "outline"}
              onClick={() => {
                setCompareMode((v) => !v);
                if (compareMode) {
                  clearCompare();
                  setCompareOpen(false);
                }
              }}
            >
              <GitCompare className="h-4 w-4 mr-1" />
              Compare
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-amber-800/40 bg-amber-950/20 px-3 py-2.5 text-xs text-amber-100/90 leading-relaxed max-w-3xl">
          <p className="font-medium text-amber-200 mb-1">Important</p>
          <p>
            Creating a weapon here does <strong>not</strong> publish it to the
            shared Catalog automatically. Weapons in <em>My Weapons</em> are
            stored in this browser only — clearing site data can remove them,
            so download a JSON backup if you care about keeping them. To have
            your weapon appear in the Catalog for everyone, download the JSON
            and send it to <strong>RaintDM</strong> so it can be shipped with
            the app.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search weapons…"
            className="max-w-xs h-9"
          />

          {compareMode && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Select 2–4 weapons ({compareSelection.length}/4)
              </span>
              <Select
                className="h-9 w-[220px]"
                value=""
                onChange={(e) => {
                  const name = e.target.value;
                  if (name) addAmellwindToCompare(name);
                }}
              >
                <option value="" disabled>
                  Add Amellwind weapon…
                </option>
                {[...amellwindWeapons]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name}
                    </option>
                  ))}
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={compareSelection.length < 2}
                onClick={() => setCompareOpen(true)}
              >
                Open compare
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
        {compareOpen && compareWeapons.length >= 2 && (
          <WeaponComparePanel
            weapons={compareWeapons}
            onClose={() => setCompareOpen(false)}
          />
        )}

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "catalog" | "mine")}
        >
          <TabsList>
            <TabsTrigger value="catalog">
              Catalog ({curated.length})
            </TabsTrigger>
            <TabsTrigger value="mine">
              My Weapons ({userWeapons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading catalog…</p>
            ) : filteredCurated.length === 0 ? (
              <EmptyState
                title="No curated weapons yet"
                description="RaintDM updates this catalog by shipping a new raintdm-weapons.json with the app. You can still create weapons under My Weapons."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCurated.map((weapon) => (
                  <WeaponForgeCard
                    key={weapon.id}
                    weapon={weapon}
                    onClick={() => openDetail(weapon)}
                    compareMode={compareMode}
                    selectedForCompare={compareSelection.includes(weapon.id)}
                    onToggleCompare={() => toggleCompare(weapon.id)}
                    onExport={() => exportOne(weapon)}
                    onClone={() => cloneToMine(weapon)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={userWeapons.length === 0}
                onClick={exportAll}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export all
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filteredUser.length === 0 ? (
              <EmptyState
                title="No custom weapons yet"
                description="Create a weapon from scratch, load an Amellwind base as a template, or import a JSON file."
                action={
                  <Button type="button" onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create your first weapon
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredUser.map((weapon) => (
                  <WeaponForgeCard
                    key={weapon.id}
                    weapon={weapon}
                    onClick={() => openDetail(weapon)}
                    compareMode={compareMode}
                    selectedForCompare={compareSelection.includes(weapon.id)}
                    onToggleCompare={() => toggleCompare(weapon.id)}
                    onEdit={() => openEdit(weapon)}
                    onExport={() => exportOne(weapon)}
                    onDelete={() => handleDelete(weapon)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <WeaponForgeDialog
        weapon={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
        onExport={exportOne}
        onDelete={handleDelete}
      />

      <WeaponForgeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        amellwindWeapons={amellwindWeapons}
        onSave={handleSave}
      />
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
