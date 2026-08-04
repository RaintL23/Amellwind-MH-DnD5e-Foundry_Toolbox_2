import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  WeaponRarityRow,
  WEAPON_RARITY_ORDER,
  RARITY_STYLES,
  defaultSlotsForWeaponRarity,
  isBaseRarity,
  isWeaponRarityTier,
  type WeaponRarityTier,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import {
  BONUS_COLUMN_KEYS,
  createFeatureDef,
} from "../types/weapon-forge.types";
import {
  addFeatureToRow,
  collectAssignedUpgradeCandidates,
  collectPriorFeatureOptions,
  findFeatureDef,
  findFeatureDefById,
  findFeatureMinRarityIndex,
  getAllAssignedFeatureNames,
  getAssignedFeaturesForRow,
  getTypedBonusValue,
  reassignFeatureColumnInRows,
  removeFeatureNameFromRow,
  renameFeatureInRow,
  resolveFeatureDef,
  setTypedBonusValue,
  suggestUpgradeName,
} from "../utils/weapon-forge-features.utils";
import { FeatureEditDialog } from "./FeatureEditDialog";
import { WeaponAutomationChainsPanel } from "./WeaponAutomationChainsPanel";

const RARITY_OPTIONS: readonly string[] = WEAPON_RARITY_ORDER;

function isRarityTier(value: string): value is WeaponRarityTier {
  return isWeaponRarityTier(value);
}

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
  usedRarities: ReadonlySet<string>;
  customFeatures: WeaponForgeFeatureDef[];
  priorOptions: { id: string; name: string; rarity: string }[];
  upgradePickForIndex: number | null;
  onUpdateRow: (index: number, nextRow: WeaponRarityRow) => void;
  onRemoveRow: (index: number) => void;
  onOpenAddFeature: (rarityIndex: number) => void;
  onOpenEditFeature: (feature: WeaponForgeFeatureDef) => void;
  onRemoveFeatureFromRarity: (
    rarityIndex: number,
    featureToken: string,
    featureId?: string,
  ) => void;
  onAddUpgrade: (rarityIndex: number, sourceFeatureId: string) => void;
  onSetUpgradePickForIndex: (index: number | null) => void;
}

const RarityRowItem = memo(function RarityRowItem({
  row,
  index,
  rowCount,
  usedRarities,
  customFeatures,
  priorOptions,
  upgradePickForIndex,
  onUpdateRow,
  onRemoveRow,
  onOpenAddFeature,
  onOpenEditFeature,
  onRemoveFeatureFromRarity,
  onAddUpgrade,
  onSetUpgradePickForIndex,
}: RarityRowItemProps) {
  const assigned = getAssignedFeaturesForRow(row, customFeatures);
  const rarityStyle = RARITY_STYLES[row.rarity] ?? RARITY_STYLES.Common;
  const baseTier = isBaseRarity(row.rarity);
  const rarityOptions = [
    ...(!isRarityTier(row.rarity) ? [row.rarity] : []),
    ...RARITY_OPTIONS.filter(
      (rarity) => rarity === row.rarity || !usedRarities.has(rarity),
    ),
  ];

  return (
    <div
      key={`${row.rarity}-${index}`}
      className="min-w-0 h-full rounded-md border border-border bg-card/40 p-3 space-y-3"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1 min-w-[140px] flex-1">
          <Label className="text-xs text-muted-foreground">Rarity</Label>
          <Select
            value={row.rarity}
            onChange={(e) =>
              onUpdateRow(index, {
                ...row,
                rarity: e.target.value,
                slots: defaultSlotsForWeaponRarity(e.target.value),
              })
            }
            className="h-8"
          >
            {rarityOptions.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </Select>
          {baseTier && (
            <p className="text-[11px] text-muted-foreground">
              Weapon-wide features (Switch Mode, Melody, …). Editable here.
            </p>
          )}
        </div>
        {!baseTier && (
          <>
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
            <div className="space-y-1 w-[88px]">
              <Label className="text-xs text-muted-foreground">To Hit</Label>
              <Input
                value={getTypedBonusValue(row, "toHit")}
                onChange={(e) =>
                  onUpdateRow(
                    index,
                    setTypedBonusValue(row, "toHit", e.target.value),
                  )
                }
                placeholder="--"
                className="h-8"
              />
            </div>
            <div className="space-y-1 w-[88px]">
              <Label className="text-xs text-muted-foreground">Damage</Label>
              <Input
                value={getTypedBonusValue(row, "damage")}
                onChange={(e) =>
                  onUpdateRow(
                    index,
                    setTypedBonusValue(row, "damage", e.target.value),
                  )
                }
                placeholder="--"
                className="h-8"
              />
            </div>
            <div className="space-y-1 w-[88px]">
              <Label className="text-xs text-muted-foreground">AC</Label>
              <Input
                value={getTypedBonusValue(row, "ac")}
                onChange={(e) =>
                  onUpdateRow(
                    index,
                    setTypedBonusValue(row, "ac", e.target.value),
                  )
                }
                placeholder="--"
                className="h-8"
              />
            </div>
          </>
        )}
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Features ({assigned.length})
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
            {priorOptions.length > 0 &&
              (upgradePickForIndex === index ? (
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
                      <option key={opt.id} value={opt.id}>
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
              ) : null)}
          </div>
        </div>

        {assigned.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            No features at this rarity yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {assigned.map((ref) => {
              const def = resolveFeatureDef(customFeatures, ref.token);
              const resourceColumn = def?.resourceColumn ?? ref.resourceColumn;
              const descPreview = def?.description?.trim();
              const upgradeSource = def?.upgradesFromId
                ? findFeatureDefById(customFeatures, def.upgradesFromId)
                : undefined;
              return (
                <li
                  key={ref.token}
                  className={cn(
                    "rounded-md border px-2.5 py-2 bg-gradient-to-br",
                    rarityStyle.border,
                    rarityStyle.bg,
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            rarityStyle.text,
                          )}
                        >
                          {ref.name}
                        </p>
                        {resourceColumn && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 bg-muted text-muted-foreground">
                            {resourceColumn}
                          </span>
                        )}
                      </div>
                      {upgradeSource && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Upgrades: {upgradeSource.name}
                        </p>
                      )}
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
                                name: ref.name,
                                description: "",
                                resourceColumn: ref.resourceColumn,
                              }),
                          )
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() =>
                          onRemoveFeatureFromRarity(
                            index,
                            ref.token,
                            def?.id ?? ref.id,
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
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
  const [automationRarityIndex, setAutomationRarityIndex] = useState(0);

  const clampedAutomationRarity = Math.min(
    Math.max(0, automationRarityIndex),
    Math.max(0, rows.length - 1),
  );

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const customFeaturesRef = useRef(customFeatures);
  customFeaturesRef.current = customFeatures;
  const editingFeatureRef = useRef(editingFeature);
  editingFeatureRef.current = editingFeature;
  const editTargetRarityIndexRef = useRef(editTargetRarityIndex);
  editTargetRarityIndexRef.current = editTargetRarityIndex;

  const updateRow = useCallback(
    (index: number, nextRow: WeaponRarityRow) => {
      onChangeRows(
        rowsRef.current.map((row, i) => (i === index ? nextRow : row)),
      );
    },
    [onChangeRows],
  );

  const upsertFeatureDef = useCallback(
    (feature: WeaponForgeFeatureDef, previous?: WeaponForgeFeatureDef) => {
      const features = customFeaturesRef.current;
      const existingIdx = features.findIndex((f) => f.id === feature.id);

      let nextRows = rowsRef.current;
      if (previous) {
        if (previous.name !== feature.name) {
          nextRows = nextRows.map((row) =>
            renameFeatureInRow(row, previous.name, feature.name, feature.id),
          );
        }
        const prevCol = previous.resourceColumn || undefined;
        const nextCol = feature.resourceColumn || undefined;
        if (prevCol !== nextCol) {
          nextRows = reassignFeatureColumnInRows(
            nextRows,
            feature.name,
            prevCol,
            nextCol,
            feature.id,
          );
        }
        if (nextRows !== rowsRef.current) {
          onChangeRows(nextRows);
        }
      }

      if (existingIdx >= 0) {
        onChangeFeatures(
          features.map((f, i) => (i === existingIdx ? feature : f)),
        );
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
    (feature: WeaponForgeFeatureDef, previous?: WeaponForgeFeatureDef) => {
      upsertFeatureDef(feature, previous);
      const targetIndex = editTargetRarityIndexRef.current;
      if (targetIndex != null) {
        onChangeRows(
          rowsRef.current.map((r, i) =>
            i === targetIndex ? addFeatureToRow(r, feature) : r,
          ),
        );
      }
    },
    [upsertFeatureDef, onChangeRows],
  );

  const removeFeatureFromRarity = useCallback(
    (rarityIndex: number, featureToken: string, featureId?: string) => {
      const nextRows = rowsRef.current.map((r, i) =>
        i === rarityIndex
          ? removeFeatureNameFromRow(r, featureToken, featureId)
          : r,
      );
      onChangeRows(nextRows);

      // Drop the def when it is no longer assigned on any rarity so it cannot
      // linger in upgrade-candidate lists (or as a same-name ghost).
      const removedId =
        featureId ??
        resolveFeatureDef(customFeaturesRef.current, featureToken)?.id;
      if (!removedId) return;

      const stillAssigned = nextRows.some((row) =>
        getAssignedFeaturesForRow(row, customFeaturesRef.current).some(
          (ref) =>
            ref.id === removedId ||
            ref.token.toLowerCase() === removedId.toLowerCase(),
        ),
      );
      if (stillAssigned) return;

      onChangeFeatures(
        customFeaturesRef.current
          .filter((f) => f.id !== removedId)
          .map((f) =>
            f.upgradesFromId === removedId
              ? { ...f, upgradesFromId: undefined }
              : f,
          ),
      );
    },
    [onChangeRows, onChangeFeatures],
  );

  const addUpgrade = useCallback(
    (rarityIndex: number, sourceFeatureId: string) => {
      const features = customFeaturesRef.current;
      const currentRows = rowsRef.current;
      const sourceDef =
        findFeatureDefById(features, sourceFeatureId) ??
        findFeatureDef(features, sourceFeatureId);
      if (!sourceDef) return;

      const allNames = [
        ...features.map((f) => f.name),
        ...getAllAssignedFeatureNames(currentRows, features),
      ];
      const upgradeName = suggestUpgradeName(sourceDef.name, allNames);
      const rootChainKey =
        sourceDef.automation?.chainKey?.trim() || sourceDef.id;
      const feature = createFeatureDef({
        name: upgradeName,
        description: sourceDef.description
          ? `Upgrades ${sourceDef.name}.\n\n${sourceDef.description}`
          : `Upgrades ${sourceDef.name}.`,
        upgradesFromId: sourceDef.id,
        resourceColumn: sourceDef.resourceColumn,
        automation: sourceDef.resourceColumn
          ? undefined
          : {
              template: "upgrade_scaler",
              chainKey: rootChainKey,
              params: {},
            },
      });

      onChangeFeatures([...features, feature]);
      onChangeRows(
        currentRows.map((r, i) =>
          i === rarityIndex ? addFeatureToRow(r, feature) : r,
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
    const used = new Set(rowsRef.current.map((r) => r.rarity));
    const nextRarity = WEAPON_RARITY_ORDER.find((rarity) => !used.has(rarity));
    if (!nextRarity) return;
    onChangeRows([
      ...rowsRef.current,
      {
        rarity: nextRarity,
        slots: defaultSlotsForWeaponRarity(nextRarity),
        columns: isBaseRarity(nextRarity)
          ? { Features: [] }
          : {
              [BONUS_COLUMN_KEYS.toHit]: "",
              Features: [],
            },
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

  const priorOptionsPerRow = useMemo(
    () =>
      rows.map((_, index) =>
        collectPriorFeatureOptions(rows, index, customFeatures),
      ),
    [rows, customFeatures],
  );

  const usedRarities = useMemo(
    () => new Set(rows.map((row) => row.rarity)),
    [rows],
  );

  const canAddRarity = WEAPON_RARITY_ORDER.some(
    (rarity) => !usedRarities.has(rarity),
  );

  const upgradeCandidatesForDialog = useMemo(() => {
    const beforeRarityIndex =
      editTargetRarityIndex ??
      (editingFeature
        ? findFeatureMinRarityIndex(
            rows,
            editingFeature.name,
            editingFeature.id,
          )
        : rows.length);

    const candidates = collectAssignedUpgradeCandidates(rows, customFeatures, {
      beforeRarityIndex,
      excludeFeatureId: editingFeature?.id,
    });

    // If the linked source is no longer assigned earlier, still expose it so
    // the editor can show and clear the upgrade link.
    const sourceId = editingFeature?.upgradesFromId;
    if (
      sourceId &&
      sourceId !== editingFeature?.id &&
      !candidates.some((c) => c.id === sourceId)
    ) {
      const source = findFeatureDefById(customFeatures, sourceId);
      if (source) return [...candidates, source];
    }

    return candidates;
  }, [rows, customFeatures, editTargetRarityIndex, editingFeature]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-sm font-medium">Rarity progression</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edit each rarity&apos;s slots, bonuses (to hit / AC / damage), and
            features. Mark a feature as a weapon resource to place it under
            Phials, Coatings, Ammo, or Notes.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={!canAddRarity}
          title={
            canAddRarity ? "Add rarity" : "All rarities are already in use"
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Rarity
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row, index) => (
          <RarityRowItem
            key={`${row.rarity}-${index}`}
            row={row}
            index={index}
            rowCount={rows.length}
            usedRarities={usedRarities}
            customFeatures={customFeatures}
            priorOptions={priorOptionsPerRow[index]}
            upgradePickForIndex={upgradePickForIndex}
            onUpdateRow={updateRow}
            onRemoveRow={removeRow}
            onOpenAddFeature={openAddFeature}
            onOpenEditFeature={openEditFeature}
            onRemoveFeatureFromRarity={removeFeatureFromRarity}
            onAddUpgrade={addUpgrade}
            onSetUpgradePickForIndex={setUpgradePickForIndex}
          />
        ))}
      </div>

      {rows.length > 0 && (
        <div className="space-y-2 rounded-md border border-border/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="automation-rarity" className="text-xs">
              Preview rarity
            </Label>
            <Select
              id="automation-rarity"
              value={String(clampedAutomationRarity)}
              onChange={(e) =>
                setAutomationRarityIndex(Number(e.target.value))
              }
              className="h-8 w-auto min-w-[8rem] text-xs"
            >
              {rows.map((row, index) => (
                <option key={`${row.rarity}-${index}`} value={String(index)}>
                  {row.rarity}
                </option>
              ))}
            </Select>
          </div>
          <WeaponAutomationChainsPanel
            rarityRows={rows}
            customFeatures={customFeatures}
            rarityIndex={clampedAutomationRarity}
          />
        </div>
      )}

      <FeatureEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editingFeature}
        upgradeCandidates={upgradeCandidatesForDialog}
        allFeatures={customFeatures}
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

          // Prefer dialog fields over the previous def so clearing
          // upgradesFromId (undefined) actually persists.
          const saved = existing
            ? {
                ...existing,
                ...feature,
                id: existing.id,
              }
            : feature;

          handleSaveFeature(saved, existing);
        }}
      />
    </div>
  );
});
