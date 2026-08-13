import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  WeaponRarityRow,
  WEAPON_RARITY_ORDER,
  defaultSlotsForWeaponRarity,
  isBaseRarity,
} from "@/shared/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  reassignFeatureColumnInRows,
  removeFeatureNameFromRow,
  renameFeatureInRow,
  resolveFeatureDef,
  suggestUpgradeName,
} from "../utils/weapon-forge-features.utils";
import { FeatureEditDialog } from "./FeatureEditDialog";
import { RarityRowItem } from "./rarity-editor/RarityRowItem";

interface WeaponRarityEditorProps {
  rows: WeaponRarityRow[];
  customFeatures: WeaponForgeFeatureDef[];
  onChangeRows: (rows: WeaponRarityRow[]) => void;
  onChangeFeatures: (features: WeaponForgeFeatureDef[]) => void;
}

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

      <FeatureEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editingFeature}
        upgradeCandidates={upgradeCandidatesForDialog}
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
