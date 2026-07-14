import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  WeaponRarityRow,
  RARITY_STYLES,
  isWeaponFeatureColumn,
} from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  ArrowUpRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import { createFeatureDef } from "../types/weapon-forge.types";
import {
  collectPriorFeatureOptions,
  findFeatureDef,
  getBonusValue,
  getFeaturesColumnNames,
  setBonusValue,
  setFeaturesColumnNames,
  suggestUpgradeName,
} from "../utils/weapon-forge-features.utils";
import { FeatureEditDialog } from "./FeatureEditDialog";

interface WeaponRarityEditorProps {
  rows: WeaponRarityRow[];
  customFeatures: WeaponForgeFeatureDef[];
  onChangeRows: (rows: WeaponRarityRow[]) => void;
  onChangeFeatures: (features: WeaponForgeFeatureDef[]) => void;
}

// ─── sub-component props ──────────────────────────────────────────────────────

interface RarityRowItemProps {
  row: WeaponRarityRow;
  index: number;
  rowCount: number;
  customFeatures: WeaponForgeFeatureDef[];
  priorOptions: { name: string; rarity: string }[];
  extras: string[];
  upgradePickForIndex: number | null;
  onUpdateRow: (index: number, nextRow: WeaponRarityRow) => void;
  onRemoveRow: (index: number) => void;
  onOpenAddFeature: (rarityIndex: number) => void;
  onOpenEditFeature: (feature: WeaponForgeFeatureDef) => void;
  onRemoveFeatureFromRarity: (rarityIndex: number, featureName: string) => void;
  onDeleteFeatureEverywhere: (feature: WeaponForgeFeatureDef) => void;
  onAddUpgrade: (rarityIndex: number, sourceName: string) => void;
  onSetUpgradePickForIndex: (index: number | null) => void;
}

const RarityRowItem = memo(function RarityRowItem({
  row,
  index,
  rowCount,
  customFeatures,
  priorOptions,
  extras,
  upgradePickForIndex,
  onUpdateRow,
  onRemoveRow,
  onOpenAddFeature,
  onOpenEditFeature,
  onRemoveFeatureFromRarity,
  onDeleteFeatureEverywhere,
  onAddUpgrade,
  onSetUpgradePickForIndex,
}: RarityRowItemProps) {
  const style = RARITY_STYLES[row.rarity];
  const featureNames = getFeaturesColumnNames(row);

  return (
    <div
      key={`${row.rarity}-${index}`}
      className="rounded-md border border-border bg-card/40 p-3 space-y-3"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1 min-w-[140px] flex-1">
          <Label className="text-xs text-muted-foreground">Rarity</Label>
          <Input
            value={row.rarity}
            onChange={(e) =>
              onUpdateRow(index, { ...row, rarity: e.target.value })
            }
            className="h-8"
          />
          {style && (
            <Badge
              variant="outline"
              className={cn("text-[10px]", style.badge)}
            >
              {row.rarity}
            </Badge>
          )}
        </div>
        <div className="space-y-1 w-20">
          <Label className="text-xs text-muted-foreground">Slots</Label>
          <Input
            type="number"
            min={0}
            value={row.slots}
            onChange={(e) =>
              onUpdateRow(index, {
                ...row,
                slots: Number.parseInt(e.target.value, 10) || 0,
              })
            }
            className="h-8"
          />
        </div>
        <div className="space-y-1 w-24">
          <Label className="text-xs text-muted-foreground">Bonus</Label>
          <Input
            value={getBonusValue(row)}
            onChange={(e) =>
              onUpdateRow(index, setBonusValue(row, e.target.value))
            }
            placeholder="--"
            className="h-8"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 mt-5 text-muted-foreground hover:text-destructive"
          onClick={() => onRemoveRow(index)}
          disabled={rowCount <= 1}
          title="Remove rarity"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {extras.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {extras.map((label) => {
            const val = row.columns[label];
            const text = Array.isArray(val)
              ? val.join(", ")
              : String(val ?? "");
            return (
              <div key={label} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {label}
                </Label>
                <Input
                  value={text}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    const columns = { ...row.columns };
                    columns[label] = raw
                      ? raw.split(/,\s*/).filter(Boolean)
                      : [];
                    onUpdateRow(index, { ...row, columns });
                  }}
                  className="h-8"
                  placeholder="comma-separated"
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Features ({featureNames.length})
          </Label>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => onOpenAddFeature(index)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
            {priorOptions.length > 0 && (
              upgradePickForIndex === index ? (
                <div className="flex items-center gap-1">
                  <Select
                    className="h-7 w-[200px] text-xs"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onAddUpgrade(index, e.target.value);
                      }
                    }}
                  >
                    <option value="" disabled>
                      Upgrade which feature…
                    </option>
                    {priorOptions.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.name} ({opt.rarity})
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => onSetUpgradePickForIndex(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => onSetUpgradePickForIndex(index)}
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Upgrade previous
                </Button>
              )
            )}
          </div>
        </div>

        {featureNames.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            No features at this rarity yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {featureNames.map((name) => {
              const def = findFeatureDef(customFeatures, name);
              const descPreview = def?.description?.trim();
              return (
                <li
                  key={name}
                  className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {name}
                      </p>
                      {descPreview ? (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {descPreview}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-500/90 mt-0.5">
                          No description yet — click Edit to add one.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          onOpenEditFeature(
                            def ??
                              createFeatureDef({
                                name,
                                description: "",
                              }),
                          )
                        }
                        title="Edit feature"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveFeatureFromRarity(index, name)}
                        title="Remove from this rarity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {def && (
                    <button
                      type="button"
                      className="mt-1 text-[10px] text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
                      onClick={() => onDeleteFeatureEverywhere(def)}
                    >
                      Delete feature entirely
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});

// ─── main component ───────────────────────────────────────────────────────────

export const WeaponRarityEditor = memo(function WeaponRarityEditor({
  rows,
  customFeatures,
  onChangeRows,
  onChangeFeatures,
}: WeaponRarityEditorProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editingFeature, setEditingFeature] =
    useState<WeaponForgeFeatureDef | null>(null);
  const [editTargetRarityIndex, setEditTargetRarityIndex] = useState<
    number | null
  >(null);
  const [upgradePickForIndex, setUpgradePickForIndex] = useState<number | null>(
    null,
  );

  // Refs so stable callbacks can always read the latest values.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const customFeaturesRef = useRef(customFeatures);
  customFeaturesRef.current = customFeatures;
  const editingFeatureRef = useRef(editingFeature);
  editingFeatureRef.current = editingFeature;
  const editTargetRarityIndexRef = useRef(editTargetRarityIndex);
  editTargetRarityIndexRef.current = editTargetRarityIndex;

  // Extra column labels (memoized — iterating rows is non-trivial when there are many).
  const extras = useMemo(() => {
    const labels: string[] = [];
    const seen = new Set(["bonus", "features"]);
    for (const row of rows) {
      for (const key of Object.keys(row.columns)) {
        const lower = key.toLowerCase();
        if (seen.has(lower)) continue;
        if (isWeaponFeatureColumn(key) && lower !== "features") {
          seen.add(lower);
          labels.push(key);
        }
      }
    }
    return labels;
  }, [rows]);

  // ── stable callbacks (deps only on the stable onChangeRows/onChangeFeatures) ──

  const updateRow = useCallback(
    (index: number, nextRow: WeaponRarityRow) => {
      onChangeRows(
        rowsRef.current.map((row, i) => (i === index ? nextRow : row)),
      );
    },
    [onChangeRows],
  );

  const upsertFeatureDef = useCallback(
    (feature: WeaponForgeFeatureDef) => {
      const features = customFeaturesRef.current;
      const existingIdx = features.findIndex((f) => f.id === feature.id);
      if (existingIdx >= 0) {
        const prev = features[existingIdx];
        const renamed = prev.name !== feature.name;
        const nextFeatures = features.map((f, i) =>
          i === existingIdx ? feature : f,
        );
        if (renamed) {
          onChangeRows(
            rowsRef.current.map((row) => {
              const names = getFeaturesColumnNames(row).map((n) =>
                n.toLowerCase() === prev.name.toLowerCase() ? feature.name : n,
              );
              return setFeaturesColumnNames(row, names);
            }),
          );
        }
        onChangeFeatures(nextFeatures);
        return;
      }
      onChangeFeatures([...features, feature]);
    },
    [onChangeRows, onChangeFeatures],
  );

  const openAddFeature = useCallback((rarityIndex: number) => {
    setEditTargetRarityIndex(rarityIndex);
    setEditingFeature(null);
    setEditOpen(true);
  }, []);

  const openEditFeature = useCallback((feature: WeaponForgeFeatureDef) => {
    setEditTargetRarityIndex(null);
    setEditingFeature(feature);
    setEditOpen(true);
  }, []);

  const handleSaveFeature = useCallback(
    (feature: WeaponForgeFeatureDef) => {
      upsertFeatureDef(feature);
      const targetIndex = editTargetRarityIndexRef.current;
      if (targetIndex != null) {
        const row = rowsRef.current[targetIndex];
        const names = getFeaturesColumnNames(row);
        if (!names.some((n) => n.toLowerCase() === feature.name.toLowerCase())) {
          onChangeRows(
            rowsRef.current.map((r, i) =>
              i === targetIndex
                ? setFeaturesColumnNames(r, [...getFeaturesColumnNames(r), feature.name])
                : r,
            ),
          );
        }
      }
    },
    [upsertFeatureDef, onChangeRows],
  );

  const removeFeatureFromRarity = useCallback(
    (rarityIndex: number, featureName: string) => {
      const row = rowsRef.current[rarityIndex];
      const names = getFeaturesColumnNames(row).filter(
        (n) => n.toLowerCase() !== featureName.toLowerCase(),
      );
      onChangeRows(
        rowsRef.current.map((r, i) =>
          i === rarityIndex ? setFeaturesColumnNames(r, names) : r,
        ),
      );
    },
    [onChangeRows],
  );

  const deleteFeatureEverywhere = useCallback(
    (feature: WeaponForgeFeatureDef) => {
      if (
        !window.confirm(
          `Remove "${feature.name}" from all rarities and delete its description?`,
        )
      ) {
        return;
      }
      onChangeFeatures(
        customFeaturesRef.current.filter((f) => f.id !== feature.id),
      );
      onChangeRows(
        rowsRef.current.map((row) =>
          setFeaturesColumnNames(
            row,
            getFeaturesColumnNames(row).filter(
              (n) => n.toLowerCase() !== feature.name.toLowerCase(),
            ),
          ),
        ),
      );
    },
    [onChangeRows, onChangeFeatures],
  );

  const addUpgrade = useCallback(
    (rarityIndex: number, sourceName: string) => {
      const features = customFeaturesRef.current;
      const currentRows = rowsRef.current;
      const allNames = features.map((f) => f.name);
      for (const row of currentRows) {
        allNames.push(...getFeaturesColumnNames(row));
      }
      const upgradeName = suggestUpgradeName(sourceName, allNames);
      const sourceDef = findFeatureDef(features, sourceName);
      const feature = createFeatureDef({
        name: upgradeName,
        description: sourceDef?.description
          ? `Upgrades ${sourceName}.\n\n${sourceDef.description}`
          : `Upgrades ${sourceName}.`,
        upgradesFromId: sourceDef?.id,
      });

      onChangeFeatures([...features, feature]);
      onChangeRows(
        currentRows.map((r, i) =>
          i === rarityIndex
            ? setFeaturesColumnNames(r, [...getFeaturesColumnNames(r), feature.name])
            : r,
        ),
      );
      setUpgradePickForIndex(null);
      setEditingFeature(feature);
      setEditTargetRarityIndex(null);
      setEditOpen(true);
    },
    [onChangeFeatures, onChangeRows],
  );

  const addRow = useCallback(() => {
    onChangeRows([
      ...rowsRef.current,
      {
        rarity: "Custom",
        slots: 1,
        columns: { Bonus: "", Features: [] },
      },
    ]);
  }, [onChangeRows]);

  const removeRow = useCallback(
    (index: number) => {
      if (rowsRef.current.length <= 1) return;
      onChangeRows(rowsRef.current.filter((_, i) => i !== index));
    },
    [onChangeRows],
  );

  // priorOptions per row (memoized to avoid recomputing on unrelated state changes)
  const priorOptionsPerRow = useMemo(
    () => rows.map((_, index) => collectPriorFeatureOptions(rows, index, customFeatures)),
    [rows, customFeatures],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-sm font-medium">Rarity progression</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edit each rarity&apos;s slots, bonus, and features. Features have
            their own name and description.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Rarity
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <RarityRowItem
            key={`${row.rarity}-${index}`}
            row={row}
            index={index}
            rowCount={rows.length}
            customFeatures={customFeatures}
            priorOptions={priorOptionsPerRow[index]}
            extras={extras}
            upgradePickForIndex={upgradePickForIndex}
            onUpdateRow={updateRow}
            onRemoveRow={removeRow}
            onOpenAddFeature={openAddFeature}
            onOpenEditFeature={openEditFeature}
            onRemoveFeatureFromRarity={removeFeatureFromRarity}
            onDeleteFeatureEverywhere={deleteFeatureEverywhere}
            onAddUpgrade={addUpgrade}
            onSetUpgradePickForIndex={setUpgradePickForIndex}
          />
        ))}
      </div>

      <FeatureEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editingFeature}
        onSave={(feature) => {
          const previousName = editingFeatureRef.current?.name;
          const previousId = editingFeatureRef.current?.id;

          const existingById = previousId
            ? customFeaturesRef.current.find((f) => f.id === previousId)
            : undefined;
          const existingByName = previousName
            ? findFeatureDef(customFeaturesRef.current, previousName)
            : undefined;
          const existing = existingById ?? existingByName;

          const saved = existing
            ? {
                ...feature,
                id: existing.id,
                upgradesFromId:
                  feature.upgradesFromId ?? existing.upgradesFromId,
              }
            : feature;

          if (previousName && previousName !== saved.name) {
            onChangeRows(
              rowsRef.current.map((row) =>
                setFeaturesColumnNames(
                  row,
                  getFeaturesColumnNames(row).map((n) =>
                    n.toLowerCase() === previousName.toLowerCase()
                      ? saved.name
                      : n,
                  ),
                ),
              ),
            );
          }

          handleSaveFeature(saved);
        }}
      />
    </div>
  );
});
