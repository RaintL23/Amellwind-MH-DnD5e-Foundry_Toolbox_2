import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  GitCompare,
  Hammer,
  Info,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { ListAreaLoading } from "@/shared/components/ListAreaLoading";
import { ClearableSearchInput } from "@/shared/components/list-filters";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";
import { useListSessionFilters } from "@/shared/hooks/useListSessionFilters";
import { useWeaponDialogUrlSync } from "@/features/amellwind/weapons/hooks/useWeaponDialogUrlSync";
import { findWeaponByUrlKey } from "@/features/amellwind/weapons/utils/weapon-dialog-url.utils";
import { useWeaponForge } from "../hooks/useWeaponForge";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { weaponToFormValues } from "../types/weapon-forge.types";
import { WeaponForgeCard } from "./WeaponForgeCard";
import { WeaponForgeDialog } from "./WeaponForgeDialog";
import { WeaponComparePanel } from "./WeaponComparePanel";
import { WeaponForgePatchNotesDialog } from "./WeaponForgePatchNotesDialog";

export function WeaponForgeList() {
  const navigate = useNavigate();
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);
  const {
    curated,
    userWeapons,
    amellwindWeapons,
    loading,
    saveFromForm,
    removeWeapon,
    importFromJson,
    exportAll,
    compareSelection,
    toggleCompare,
    clearCompare,
    resolveCompareWeapons,
  } = useWeaponForge();

  const { urlWeaponKey, urlRarityParam, syncOpen, syncClose, syncRarity } =
    useWeaponDialogUrlSync();

  const [tab, setTab] = useState<"catalog" | "mine">("catalog");
  const { q, patchFilters } = useListSessionFilters({
    listId: "weapon-forge",
    stringKeys: ["q"],
    multiKeys: [],
    urlPreserveKeys: ["weapon", "rarity"],
  });
  const commitSearch = useCallback(
    (nextQ: string) => patchFilters({ q: nextQ }),
    [patchFilters],
  );
  const { searchDraft, setSearchDraft, appliedSearch, isSearchPending } =
    useDebouncedListSearch(q, commitSearch);

  const [selected, setSelected] = useState<CustomWeapon | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterList = useCallback(
    (list: CustomWeapon[]) => {
      const q = appliedSearch.trim().toLowerCase();
      if (!q) return list;
      return list.filter((w) => w.name.toLowerCase().includes(q));
    },
    [appliedSearch],
  );

  const filteredCurated = useMemo(
    () => filterList(curated),
    [curated, filterList],
  );
  const filteredUser = useMemo(
    () => filterList(userWeapons),
    [userWeapons, filterList],
  );

  const allDetailWeapons = useMemo(
    () => [...curated, ...userWeapons],
    [curated, userWeapons],
  );

  useEffect(() => {
    if (!urlWeaponKey) {
      setDetailOpen(false);
      setSelected(null);
      return;
    }
    if (loading) return;

    const found = findWeaponByUrlKey(allDetailWeapons, urlWeaponKey);
    if (found) {
      setSelected(found);
      setDetailOpen(true);
      setTab(found.isCustom ? "mine" : "catalog");
    }
  }, [urlWeaponKey, allDetailWeapons, loading]);

  function openCreate() {
    navigate("/weapon-forge/new");
  }

  function openEdit(weapon: CustomWeapon) {
    navigate(`/weapon-forge/edit/${encodeURIComponent(weapon.id)}`);
  }

  function openDetail(weapon: CustomWeapon) {
    if (compareMode) {
      toggleCompare(weapon.id);
      return;
    }
    setSelected(weapon);
    setDetailOpen(true);
    syncOpen(weapon, 0);
  }

  const handleDetailOpenChange = useCallback(
    (open: boolean) => {
      setDetailOpen(open);
      if (!open) {
        setSelected(null);
        syncClose();
      }
    },
    [syncClose],
  );

  const handleRarityChange = useCallback(
    (rarity: string) => {
      syncRarity(rarity);
    },
    [syncRarity],
  );

  function handleDelete(weapon: CustomWeapon) {
    if (!window.confirm(`Delete "${weapon.name}"? This cannot be undone.`)) {
      return;
    }
    removeWeapon(weapon.id);
    if (selected?.id === weapon.id) {
      handleDetailOpenChange(false);
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
      <div className="shrink-0 border-b border-border px-4 py-4 md:px-6 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <Hammer className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                <span className="sm:hidden">Weapon Forge</span>
                <span className="hidden sm:inline">
                  MH Weapons — Amellwind Format by RaintDM
                </span>
              </h1>
            </div>
            <p className="hidden sm:block text-sm text-muted-foreground max-w-2xl">
              Create and tweak Monster Hunter weapons using Amellwind&apos;s
              format for your own tables. Curated catalog ships with the app;
              your custom weapons stay in this browser until you export JSON.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Important notes about Weapon Forge"
                aria-label="Important notes about Weapon Forge"
                className="h-8 shrink-0 gap-1.5 px-2 text-amber-200/80 hover:bg-amber-950/40 hover:text-amber-100"
              >
                <Info className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Important</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-200">
                  <Info className="h-5 w-5" />
                  Important
                </DialogTitle>
                <DialogDescription>
                  How catalog vs custom weapons work in Weapon Forge.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Catalog is curated
                  </p>
                  <p>
                    Creating a weapon here does <strong>not</strong> publish it
                    to the shared Catalog automatically.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    My Weapons stay local
                  </p>
                  <p>
                    Weapons in <em>My Weapons</em> are stored in this browser
                    only — clearing site data can remove them, so download a
                    JSON backup if you care about keeping them.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Want it in the Catalog?
                  </p>
                  <p>
                    Download the JSON and send it to{" "}
                    <strong className="text-foreground">RaintDM</strong> so it
                    can be shipped with the app.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Why a{" "}
                    <button
                      type="button"
                      onClick={() => setPatchNotesOpen(true)}
                      className="text-amber-200 underline underline-offset-2 decoration-amber-200/50 hover:text-amber-100 hover:decoration-amber-100 transition-colors"
                    >
                      Patch Notes
                    </button>
                    ?
                  </p>
                  <p>
                    Because I find the idea funny and this page is for my use
                    and enjoyment haha.
                  </p>
                </div>
              </DialogBody>
            </DialogContent>
          </Dialog>

          <WeaponForgePatchNotesDialog
            open={patchNotesOpen}
            onOpenChange={setPatchNotesOpen}
          />
        </div>

        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <ClearableSearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder="Search weapons…"
            className="w-full max-w-xs sm:w-auto"
            inputClassName="h-9"
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openCreate} className="h-9">
              <Plus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">New weapon</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Import JSON</span>
              <span className="sm:hidden">Import</span>
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
              className="h-9"
              onClick={() => {
                setCompareMode((v) => !v);
                if (compareMode) {
                  clearCompare();
                  setCompareOpen(false);
                }
              }}
            >
              <GitCompare className="h-3 w-3 mr-1" />
              Compare
            </Button>
          </div>

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

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 md:px-6 space-y-4">
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
            {loading || isSearchPending ? (
              <ListAreaLoading variant="cards" count={8} />
            ) : filteredCurated.length === 0 ? (
              <EmptyState
                title="No curated weapons yet"
                description="Curated weapons load from public/data/raintdm-weapons/ (one JSON per weapon). Add a file and rebuild, or create weapons under My Weapons."
              />
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCurated.map((weapon) => (
                  <WeaponForgeCard
                    key={weapon.id}
                    weapon={weapon}
                    onClick={() => openDetail(weapon)}
                    compareMode={compareMode}
                    selectedForCompare={compareSelection.includes(weapon.id)}
                    onToggleCompare={() => toggleCompare(weapon.id)}
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

            {loading || isSearchPending ? (
              <ListAreaLoading variant="cards" count={4} />
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
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredUser.map((weapon) => (
                  <WeaponForgeCard
                    key={weapon.id}
                    weapon={weapon}
                    onClick={() => openDetail(weapon)}
                    compareMode={compareMode}
                    selectedForCompare={compareSelection.includes(weapon.id)}
                    onToggleCompare={() => toggleCompare(weapon.id)}
                    onEdit={() => openEdit(weapon)}
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
        onOpenChange={handleDetailOpenChange}
        initialRarity={urlRarityParam || null}
        onRarityChange={handleRarityChange}
        onEdit={openEdit}
        onDelete={handleDelete}
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
