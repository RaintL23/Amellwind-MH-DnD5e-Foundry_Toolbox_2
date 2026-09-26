import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ConfirmDialogFn } from "../hooks/useConfirmDialog";
import { getListDndItems } from "@/features/dnd/items/services/dnd-item.service";
import {
  getDndArmors,
  getDndWeapons,
} from "@/features/dnd/items/services/dnd-equipment.service";
import { getAllWeapons } from "@/features/amellwind/weapons/services/weapon.service";
import { getAllForgeWeapons } from "@/features/raintdm/weapon-forge/services/weapon-forge.service";
import { getAllItems } from "@/features/amellwind/shops/services/item.service";
import { MH_ARMOR_CATALOG } from "@/features/raintdm/builder/utils/cart-equipment.resolver";
import { STANDALONE_SHIELD } from "@/features/raintdm/builder/data/shield.data";
import { renderFiveToolsEntries } from "@/shared/utils/fivetools-parser";
import type {
  PlayCharacterCompiled,
  PlayInventoryItem,
  PlaySessionState,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import { getEncumbrance } from "../utils/encumbrance.utils";
import { applyEquipExclusivity } from "../utils/effective-armor-class";
import {
  healingExpressionFromPotionName,
  isEquippableInventoryItem,
  isUsableInventoryItem,
} from "../utils/inventory-item.utils";
import {
  playItemFromArmor,
  playItemFromCustom,
  playItemFromDndItem,
  playItemFromMhItem,
  playItemFromWeapon,
  type PlayInventoryCatalogEntry,
} from "../utils/play-inventory-from-catalog";
import { rollExpression } from "@/shared/utils/dice.utils";
import type { useSheetRoller } from "../hooks/useSheetRoller";
import {
  CatalogPickerGrid,
  CatalogPickerTile,
} from "./CatalogPickerGrid";
import { useCatalogItemPreview } from "./useCatalogItemPreview";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import type { ArmorItem, MHItem, Weapon } from "@/shared/types";
import type { DndItem } from "@/shared/types/dnd-item.types";

function weaponDescriptionText(w: Weapon): string | undefined {
  const parts = [w.description, ...(w.supplementaryNotes ?? [])]
    .map((s) => s?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

function armorDescriptionText(a: ArmorItem): string | undefined {
  const t = a.description?.trim();
  return t || undefined;
}

function mhDescriptionText(item: MHItem): string | undefined {
  if (!item.entries?.length) return undefined;
  const lines = renderFiveToolsEntries(item.entries);
  return lines.length > 0 ? lines.join("\n\n") : undefined;
}

function dndDescription(item: DndItem): {
  descriptionContent?: DndItem["description"];
  descriptionText?: string;
} {
  if (item.description?.length) {
    return { descriptionContent: item.description };
  }
  return {};
}

interface InventoryPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  dispatch: (a: PlaySessionAction) => void;
  confirm: ConfirmDialogFn;
  logRoll: ReturnType<typeof useSheetRoller>["logRoll"];
}

function attackOpts(compiled: PlayCharacterCompiled) {
  return {
    attackAbilityMod: Math.max(
      compiled.abilities.str.mod,
      compiled.abilities.dex.mod,
    ),
    proficiencyBonus: compiled.proficiencyBonus,
  };
}

async function loadCatalogEntries(): Promise<PlayInventoryCatalogEntry[]> {
  const [dndItems, dndWeapons, dndArmors, forge, agmh, mhItems] =
    await Promise.all([
      getListDndItems().catch(() => []),
      getDndWeapons(true).catch(() => []),
      getDndArmors(true).catch(() => []),
      getAllForgeWeapons().catch(() => []),
      getAllWeapons().catch(() => []),
      getAllItems().catch(() => []),
    ]);

  const entries: PlayInventoryCatalogEntry[] = [];
  const seenDnd = new Set<string>();

  for (const item of dndItems) {
    const key = `dnd-item:${item.id}`;
    if (seenDnd.has(item.name.toLowerCase())) continue;
    seenDnd.add(item.name.toLowerCase());
    entries.push({
      key,
      name: item.name,
      summary: [item.typeLabel, item.rarityLabel].filter(Boolean).join(" · "),
      source: "dnd",
      tab: "dnd",
      ...dndDescription(item),
      toItem: (opts) => playItemFromDndItem(item, opts),
    });
  }

  // Ensure weapons/armors not only in list items are present
  for (const w of dndWeapons) {
    const k = w.name.toLowerCase();
    if (seenDnd.has(k)) continue;
    seenDnd.add(k);
    entries.push({
      key: `dnd-w:${w.id ?? w.name}`,
      name: w.name,
      summary: "Weapon",
      source: "dnd",
      tab: "dnd",
      descriptionText: weaponDescriptionText(w),
      toItem: (opts) => playItemFromWeapon(w, { ...opts, source: "dnd" }),
    });
  }
  for (const a of dndArmors) {
    const k = a.name.toLowerCase();
    if (seenDnd.has(k)) continue;
    seenDnd.add(k);
    entries.push({
      key: `dnd-a:${a.name}`,
      name: a.name,
      summary: a.category === "shield" ? "Shield" : "Armor",
      source: "dnd",
      tab: "dnd",
      descriptionText: armorDescriptionText(a),
      toItem: () => playItemFromArmor(a, { source: "dnd" }),
    });
  }

  const seenAw = new Set<string>();
  for (const w of [...forge, ...agmh]) {
    const k = w.name.toLowerCase();
    if (seenAw.has(k)) continue;
    seenAw.add(k);
    entries.push({
      key: `aw-w:${w.id ?? w.name}`,
      name: w.name,
      summary: "Weapon",
      source: "amellwind",
      tab: "amellwind",
      descriptionText: weaponDescriptionText(w),
      toItem: (opts) =>
        playItemFromWeapon(w, { ...opts, source: "amellwind" }),
    });
  }
  for (const a of MH_ARMOR_CATALOG) {
    const k = a.name.toLowerCase();
    if (seenAw.has(k)) continue;
    seenAw.add(k);
    entries.push({
      key: `aw-a:${a.name}`,
      name: a.name,
      summary: a.category === "clothing" ? "Clothing" : "Armor",
      source: "amellwind",
      tab: "amellwind",
      descriptionText: armorDescriptionText(a),
      toItem: () => playItemFromArmor(a, { source: "amellwind" }),
    });
  }
  if (!seenAw.has("shield")) {
    entries.push({
      key: "aw-shield",
      name: STANDALONE_SHIELD.name,
      summary: `Shield +${STANDALONE_SHIELD.acBonus} AC`,
      source: "amellwind",
      tab: "amellwind",
      descriptionText: `A shield grants a +${STANDALONE_SHIELD.acBonus} bonus to AC while wielded.`,
      toItem: () =>
        playItemFromArmor(
          {
            name: STANDALONE_SHIELD.name,
            category: "shield",
            baseAC: STANDALONE_SHIELD.acBonus,
            maxDexBonus: null,
            rarity: STANDALONE_SHIELD.rarity,
            runeSlots: 0,
            stealthDisadvantage: false,
            weight: STANDALONE_SHIELD.weight,
          },
          { source: "amellwind" },
        ),
    });
  }
  for (const item of mhItems) {
    const k = item.name.toLowerCase();
    if (seenAw.has(k)) continue;
    seenAw.add(k);
    entries.push({
      key: `aw-i:${item.name}`,
      name: item.name,
      summary: item.typeLabel,
      source: "amellwind",
      tab: "amellwind",
      descriptionText: mhDescriptionText(item),
      toItem: () => playItemFromMhItem(item),
    });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export function InventoryPanel({
  compiled,
  session,
  dispatch,
  confirm,
  logRoll,
}: InventoryPanelProps) {
  const enc = getEncumbrance(compiled, session);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<
    "browse" | "preview" | "quantities"
  >("browse");
  const [catalog, setCatalog] = useState<PlayInventoryCatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customName, setCustomName] = useState("");
  const [customWeight, setCustomWeight] = useState("0");
  const [rowDetail, setRowDetail] = useState<PlayInventoryItem | null>(null);
  const [previewEntry, setPreviewEntry] =
    useState<PlayInventoryCatalogEntry | null>(null);

  const attuned = session.inventory.filter((i) => i.attuned).length;
  const equipped = useMemo(
    () => session.inventory.filter((i) => i.equipped),
    [session.inventory],
  );
  const backpack = useMemo(
    () => session.inventory.filter((i) => !i.equipped),
    [session.inventory],
  );

  useEffect(() => {
    if (!pickerOpen || catalog.length > 0) return;
    setCatalogLoading(true);
    void loadCatalogEntries()
      .then(setCatalog)
      .finally(() => setCatalogLoading(false));
  }, [pickerOpen, catalog.length]);

  useEffect(() => {
    if (!pickerOpen) {
      setPickerStep("browse");
      setSelectedKeys([]);
      setQuantities({});
      setQ("");
      setPreviewEntry(null);
    }
  }, [pickerOpen]);

  const opts = attackOpts(compiled);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        (e.summary?.toLowerCase().includes(query) ?? false),
    );
  }, [catalog, q]);

  const selectedEntries = useMemo(
    () =>
      selectedKeys
        .map((key) => catalog.find((e) => e.key === key))
        .filter((e): e is PlayInventoryCatalogEntry => e != null),
    [catalog, selectedKeys],
  );

  const toggleSelected = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const goToQuantities = () => {
    if (selectedKeys.length === 0) return;
    setQuantities((prev) => {
      const next: Record<string, number> = {};
      for (const key of selectedKeys) {
        next[key] = Math.max(1, prev[key] ?? 1);
      }
      return next;
    });
    setPickerStep("quantities");
  };

  const confirmSelected = () => {
    for (const entry of selectedEntries) {
      const qty = Math.max(1, quantities[entry.key] ?? 1);
      const item = entry.toItem(opts);
      dispatch({
        type: "UPSERT_ITEM",
        item: { ...item, quantity: qty },
      });
    }
    setPickerOpen(false);
  };

  const addCustom = () => {
    const n = customName.trim();
    if (!n) return;
    dispatch({
      type: "UPSERT_ITEM",
      item: playItemFromCustom(n, parseFloat(customWeight) || 0),
    });
    setCustomName("");
    setCustomWeight("0");
    setPickerOpen(false);
  };

  const updateItem = (item: PlayInventoryItem) =>
    dispatch({ type: "UPSERT_ITEM", item });

  const setEquipped = (item: PlayInventoryItem, next: boolean) => {
    const nextInv = applyEquipExclusivity(session.inventory, item.id, next);
    dispatch({ type: "SET_INVENTORY", inventory: nextInv });
  };

  const setAttuned = (item: PlayInventoryItem, next: boolean) => {
    if (next && !item.attuned && attuned >= compiled.attunementMax) return;
    updateItem({ ...item, attuned: next });
  };

  const removeItem = async (item: PlayInventoryItem) => {
    const ok = await confirm({
      title: "Remove item?",
      description: `Remove ${item.name} from inventory?`,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    dispatch({ type: "REMOVE_ITEM", id: item.id });
  };

  const consumeInventoryItem = (item: PlayInventoryItem) => {
    if (item.quantity <= 1) {
      dispatch({ type: "REMOVE_ITEM", id: item.id });
      return;
    }
    dispatch({
      type: "UPSERT_ITEM",
      item: { ...item, quantity: item.quantity - 1 },
    });
  };

  const handleUseItem = (item: PlayInventoryItem) => {
    const healExpr = healingExpressionFromPotionName(item.name);
    if (healExpr) {
      const result = rollExpression(healExpr);
      dispatch({ type: "SET_HP_DELTA", delta: result.total });
      logRoll({
        label: `Use ${item.name}`,
        expression: healExpr,
        total: result.total,
        detail: `${result.detail} HP restored`,
        mode: "normal",
      });
    } else {
      logRoll({
        label: `Use ${item.name}`,
        expression: "—",
        total: 0,
        detail:
          item.notes?.trim() ||
          item.summary?.trim() ||
          "Item used — apply effects manually if needed",
        mode: "normal",
      });
    }
    consumeInventoryItem(item);
  };

  const cur = session.currency;

  const tabEntries = (tab: "dnd" | "amellwind") =>
    filtered.filter((e) => e.tab === tab).slice(0, 100);

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-3 shadow-none">
        <div className="flex justify-between text-xs">
          <span>
            Weight {enc.totalLb} / {enc.capacityLb} lb
          </span>
          <span
            className={cn(
              enc.tier === "normal" && "text-muted-foreground",
              enc.tier === "encumbered" && "text-amber-600",
              (enc.tier === "heavily" || enc.tier === "over") &&
                "text-destructive",
            )}
          >
            {enc.tier}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              enc.tier === "over" ? "bg-destructive" : "bg-primary",
            )}
            style={{
              width: `${Math.min(100, (enc.totalLb / Math.max(1, enc.capacityLb)) * 100)}%`,
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Attunement {attuned} / {compiled.attunementMax}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: compiled.attunementMax }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border",
                  i < attuned
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40",
                )}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {(["pp", "gp", "ep", "sp", "cp"] as const).map((k) => (
            <label key={k} className="text-center text-[10px] uppercase">
              {k}
              <Input
                inputMode="numeric"
                className="mt-0.5 h-9 text-center"
                value={cur[k]}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CURRENCY",
                    currency: {
                      ...cur,
                      [k]: Math.max(0, parseInt(e.target.value, 10) || 0),
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </Card>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-between px-2"
          >
            Settings
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="coin-weight" className="text-sm">
              Coin weight
            </Label>
            <Switch
              id="coin-weight"
              checked={session.countCoinWeight}
              onCheckedChange={(v) =>
                dispatch({ type: "SET_FLAGS", countCoinWeight: v })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="variant-enc" className="text-sm">
              Variant encumbrance
            </Label>
            <Switch
              id="variant-enc"
              checked={session.useVariantEncumbrance}
              onCheckedChange={(v) =>
                dispatch({ type: "SET_FLAGS", useVariantEncumbrance: v })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="ac-adjust" className="text-sm">
              AC adjust
            </Label>
            <Input
              id="ac-adjust"
              inputMode="numeric"
              className="h-9 w-20"
              value={session.acAdjust}
              onChange={(e) =>
                dispatch({
                  type: "SET_AC_ADJUST",
                  value: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Equipped</h3>
          <Button
            type="button"
            size="sm"
            className="min-h-9 gap-1"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>
        <ul className="space-y-1.5">
          {equipped.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              attunementFull={attuned >= compiled.attunementMax}
              onChange={updateItem}
              onEquip={(next) => setEquipped(item, next)}
              onAttune={(next) => setAttuned(item, next)}
              onUse={() => handleUseItem(item)}
              onRemove={() => void removeItem(item)}
              onOpenDetail={() => setRowDetail(item)}
            />
          ))}
          {equipped.length === 0 ? (
            <li className="text-xs text-muted-foreground">Nothing equipped</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Backpack</h3>
        <ul className="space-y-1.5">
          {backpack.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              attunementFull={attuned >= compiled.attunementMax}
              onChange={updateItem}
              onEquip={(next) => setEquipped(item, next)}
              onAttune={(next) => setAttuned(item, next)}
              onUse={() => handleUseItem(item)}
              onRemove={() => void removeItem(item)}
              onOpenDetail={() => setRowDetail(item)}
            />
          ))}
          {backpack.length === 0 ? (
            <li className="text-xs text-muted-foreground">Empty</li>
          ) : null}
        </ul>
      </section>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh]">
          <SheetHeader>
            <SheetTitle>
              {pickerStep === "quantities"
                ? "Quantities"
                : pickerStep === "preview"
                  ? (previewEntry?.name ?? "Item")
                  : "Add item"}
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-3">
            {pickerStep === "quantities" ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPickerStep("browse")}
                >
                  ← Back
                </Button>
                <p className="text-xs text-muted-foreground">
                  Set how many of each selected item to add.
                </p>
                <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
                  {selectedEntries.map((entry) => {
                    const qty = quantities[entry.key] ?? 1;
                    const setQty = (next: number) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [entry.key]: Math.max(1, next),
                      }));
                    return (
                      <li
                        key={entry.key}
                        className="flex items-center gap-3 rounded border border-border px-2 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {entry.name}
                          </p>
                          {entry.summary ? (
                            <p className="truncate text-[10px] text-muted-foreground">
                              {entry.summary}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 px-0"
                            disabled={qty <= 1}
                            aria-label={`Decrease ${entry.name}`}
                            onClick={() => setQty(qty - 1)}
                          >
                            −
                          </Button>
                          <Input
                            inputMode="numeric"
                            className="h-8 w-12 text-center"
                            value={qty}
                            onChange={(e) => {
                              setQty(parseInt(e.target.value, 10) || 1);
                            }}
                            aria-label={`Quantity for ${entry.name}`}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 px-0"
                            aria-label={`Increase ${entry.name}`}
                            onClick={() => setQty(qty + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  type="button"
                  className="w-full"
                  onClick={confirmSelected}
                >
                  Add {selectedEntries.length} to inventory
                </Button>
              </div>
            ) : pickerStep === "preview" && previewEntry ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewEntry(null);
                    setPickerStep("browse");
                  }}
                >
                  ← Back
                </Button>
                {previewEntry.summary ? (
                  <p className="text-sm text-muted-foreground">
                    {previewEntry.summary}
                  </p>
                ) : null}
                {previewEntry.descriptionContent &&
                previewEntry.descriptionContent.length > 0 ? (
                  <StatBlockContentView
                    content={previewEntry.descriptionContent}
                  />
                ) : previewEntry.descriptionText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {previewEntry.descriptionText}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No description available for this item.
                  </p>
                )}
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  autoFocus
                />
                <Tabs defaultValue="dnd">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dnd">D&D</TabsTrigger>
                    <TabsTrigger value="amellwind">Amellwind</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                  </TabsList>
                  {(["dnd", "amellwind"] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-3">
                      {catalogLoading ? (
                        <p className="text-xs text-muted-foreground">
                          Loading catalog…
                        </p>
                      ) : (
                        <CatalogPickerGrid>
                          {tabEntries(tab).map((entry) => (
                            <InventoryCatalogTile
                              key={entry.key}
                              entry={entry}
                              selected={selectedKeys.includes(entry.key)}
                              onToggle={() => toggleSelected(entry.key)}
                              onPreview={() => {
                                setPreviewEntry(entry);
                                setPickerStep("preview");
                              }}
                            />
                          ))}
                          {tabEntries(tab).length === 0 ? (
                            <p className="col-span-full text-xs text-muted-foreground">
                              No matches
                            </p>
                          ) : null}
                        </CatalogPickerGrid>
                      )}
                    </TabsContent>
                  ))}
                  <TabsContent value="custom" className="mt-3 space-y-3">
                    <Input
                      placeholder="Item name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                    <Input
                      placeholder="Weight (lb)"
                      inputMode="decimal"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(e.target.value)}
                    />
                    <Button
                      type="button"
                      className="w-full"
                      disabled={!customName.trim()}
                      onClick={addCustom}
                    >
                      Add custom item
                    </Button>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetBody>
          {pickerStep === "browse" && selectedKeys.length > 0 ? (
            <div className="flex shrink-0 gap-2 border-t border-border p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedKeys([])}
              >
                Clear
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={goToQuantities}
              >
                Continue ({selectedKeys.length})
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={rowDetail != null}
        onOpenChange={(open) => {
          if (!open) setRowDetail(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[50dvh]">
          <SheetHeader>
            <SheetTitle>{rowDetail?.name}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-2 text-sm">
            {rowDetail?.summary ? (
              <p className="text-muted-foreground">{rowDetail.summary}</p>
            ) : null}
            {rowDetail?.notes ? <p>{rowDetail.notes}</p> : null}
            <p className="text-xs text-muted-foreground">
              {[
                rowDetail?.kind,
                rowDetail?.source,
                `${rowDetail?.weightLb ?? 0} lb`,
                rowDetail?.isWeapon && rowDetail.attackBonus != null
                  ? `Atk ${rowDetail.attackBonus >= 0 ? "+" : ""}${rowDetail.attackBonus}`
                  : null,
                rowDetail?.armorAc != null ? `AC ${rowDetail.armorAc}` : null,
                rowDetail?.shieldBonus != null
                  ? `Shield +${rowDetail.shieldBonus}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InventoryCatalogTile({
  entry,
  selected,
  onToggle,
  onPreview,
}: {
  entry: PlayInventoryCatalogEntry;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const previewHandlers = useCatalogItemPreview(onPreview);
  return (
    <CatalogPickerTile
      title={entry.name}
      subtitle={entry.summary}
      selected={selected}
      onClick={onToggle}
      onPointerDown={previewHandlers.onPointerDown}
      onPointerUp={previewHandlers.onPointerUp}
      onPointerCancel={previewHandlers.onPointerCancel}
      onPointerLeave={previewHandlers.onPointerLeave}
      onClickCapture={previewHandlers.onClickCapture}
    />
  );
}

function ItemRow({
  item,
  attunementFull,
  onChange,
  onEquip,
  onAttune,
  onUse,
  onRemove,
  onOpenDetail,
}: {
  item: PlayInventoryItem;
  attunementFull: boolean;
  onChange: (i: PlayInventoryItem) => void;
  onEquip: (equipped: boolean) => void;
  onAttune: (attuned: boolean) => void;
  onUse: () => void;
  onRemove: () => void;
  onOpenDetail: () => void;
}) {
  const canEquip = isEquippableInventoryItem(item) || item.equipped;
  const canUse = isUsableInventoryItem(item);
  const canAttune = item.requiresAttunement || item.attuned;
  const attuneDisabled = !item.attuned && attunementFull;
  return (
    <li className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="truncate text-left font-medium hover:underline"
          onClick={onOpenDetail}
        >
          {item.name}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {item.equipped ? (
            <Badge variant="secondary" className="px-1 py-0 text-[9px]">
              Equipped
            </Badge>
          ) : null}
          {item.attuned ? (
            <Badge variant="secondary" className="px-1 py-0 text-[9px]">
              Attuned
            </Badge>
          ) : null}
          {item.kind ? (
            <Badge variant="outline" className="px-1 py-0 text-[9px]">
              {item.kind}
            </Badge>
          ) : null}
          <span className="text-[10px] text-muted-foreground">
            {item.weightLb} lb × {item.quantity}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 w-9 px-0"
          disabled={item.quantity <= 0}
          aria-label="Decrease quantity"
          onClick={() =>
            onChange({
              ...item,
              quantity: Math.max(0, item.quantity - 1),
            })
          }
        >
          −
        </Button>
        <span className="w-6 text-center text-xs tabular-nums">
          {item.quantity}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 w-9 px-0"
          aria-label="Increase quantity"
          onClick={() => onChange({ ...item, quantity: item.quantity + 1 })}
        >
          +
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 w-9 px-0"
              aria-label={`Actions for ${item.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEquip ? (
              <DropdownMenuItem onSelect={() => onEquip(!item.equipped)}>
                {item.equipped ? "Unequip" : "Equip"}
              </DropdownMenuItem>
            ) : null}
            {canUse ? (
              <DropdownMenuItem
                disabled={item.quantity <= 0}
                onSelect={onUse}
              >
                Use
              </DropdownMenuItem>
            ) : null}
            {canAttune ? (
              <DropdownMenuItem
                disabled={attuneDisabled && !item.attuned}
                onSelect={() => onAttune(!item.attuned)}
              >
                {item.attuned ? "Unattune" : "Attune"}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onSelect={() => {
                // Defer so the menu fully closes before the detail sheet opens
                // (avoids Radix pointer-events lock on body).
                window.setTimeout(onOpenDetail, 0);
              }}
            >
              Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                window.setTimeout(() => void onRemove(), 0);
              }}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
