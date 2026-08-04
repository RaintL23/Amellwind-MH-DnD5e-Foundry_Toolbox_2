import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WeaponForgeFeatureDef } from "../types/weapon-forge.types";
import {
  RESOURCE_COLUMN_PRESETS,
  createFeatureDef,
} from "../types/weapon-forge.types";
import { findFeatureDefById } from "../utils/weapon-forge-features.utils";
import type { WeaponFeatureAutomationSpec } from "@/shared/foundry/weapons";
import { mergeAutomationSpecs } from "@/shared/foundry/weapons";
import { lookupWeaponFeatureAutomation } from "@/shared/foundry/weapons";
import { FeatureAutomationEditor } from "./FeatureAutomationEditor";

const CUSTOM_COLUMN_VALUE = "__custom__";

interface FeatureEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: WeaponForgeFeatureDef | null;
  title?: string;
  /** Features that can be selected as the upgrade source. */
  upgradeCandidates?: WeaponForgeFeatureDef[];
  /** All features — used to preview merged chain automation. */
  allFeatures?: WeaponForgeFeatureDef[];
  onSave: (feature: WeaponForgeFeatureDef) => void;
}

function buildUpgradeChainSpecs(
  feature: {
    id?: string;
    upgradesFromId?: string;
    automation?: WeaponFeatureAutomationSpec;
    name: string;
  },
  allFeatures: WeaponForgeFeatureDef[],
): Array<WeaponFeatureAutomationSpec | undefined> {
  const byId = new Map(allFeatures.map((f) => [f.id, f]));
  const chain: WeaponForgeFeatureDef[] = [];
  let cursor: WeaponForgeFeatureDef | undefined = feature.upgradesFromId
    ? byId.get(feature.upgradesFromId)
    : undefined;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    chain.unshift(cursor);
    cursor = cursor.upgradesFromId
      ? byId.get(cursor.upgradesFromId)
      : undefined;
  }

  const selfAutomation =
    feature.automation ??
    lookupWeaponFeatureAutomation(feature.name) ??
    undefined;

  return [
    ...chain.map((f) => f.automation ?? lookupWeaponFeatureAutomation(f.name)),
    selfAutomation,
  ];
}

export function FeatureEditDialog({
  open,
  onOpenChange,
  initial,
  title,
  upgradeCandidates = [],
  allFeatures = [],
  onSave,
}: FeatureEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [upgradesFromId, setUpgradesFromId] = useState("");
  const [isWeaponResource, setIsWeaponResource] = useState(false);
  const [resourcePreset, setResourcePreset] = useState<string>(
    RESOURCE_COLUMN_PRESETS[0],
  );
  const [customResourceColumn, setCustomResourceColumn] = useState("");
  const [automation, setAutomation] = useState<
    WeaponFeatureAutomationSpec | undefined
  >(undefined);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setUpgradesFromId(initial?.upgradesFromId ?? "");

    const column = initial?.resourceColumn?.trim() ?? "";
    if (column) {
      setIsWeaponResource(true);
      const isPreset = (RESOURCE_COLUMN_PRESETS as readonly string[]).includes(
        column,
      );
      if (isPreset) {
        setResourcePreset(column);
        setCustomResourceColumn("");
      } else {
        setResourcePreset(CUSTOM_COLUMN_VALUE);
        setCustomResourceColumn(column);
      }
      setAutomation(undefined);
    } else {
      setIsWeaponResource(false);
      setResourcePreset(RESOURCE_COLUMN_PRESETS[0]);
      setCustomResourceColumn("");
      if (initial?.automation) {
        setAutomation(initial.automation);
      } else if (initial?.name) {
        const fromRegistry = lookupWeaponFeatureAutomation(initial.name);
        setAutomation(
          fromRegistry
            ? {
                ...fromRegistry,
                params: { ...fromRegistry.params },
                enabled: fromRegistry.enabled !== false,
              }
            : undefined,
        );
      } else {
        setAutomation(undefined);
      }
    }
  }, [open, initial]);

  const candidates = upgradeCandidates.filter((f) => f.id !== initial?.id);

  const mergedPreviewJson = useMemo(() => {
    if (isWeaponResource) return undefined;
    const merged = mergeAutomationSpecs(
      buildUpgradeChainSpecs(
        {
          id: initial?.id,
          name,
          upgradesFromId: upgradesFromId || undefined,
          automation,
        },
        allFeatures.length > 0 ? allFeatures : upgradeCandidates,
      ),
    );
    if (!merged) return undefined;
    return JSON.stringify(
      {
        template: merged.template,
        enabled: merged.enabled !== false,
        chainKey: merged.chainKey,
        params: merged.params ?? {},
      },
      null,
      2,
    );
  }, [
    isWeaponResource,
    name,
    upgradesFromId,
    automation,
    allFeatures,
    upgradeCandidates,
    initial?.id,
  ]);

  function resolveResourceColumn(): string | undefined {
    if (!isWeaponResource) return undefined;
    if (resourcePreset === CUSTOM_COLUMN_VALUE) {
      return customResourceColumn.trim() || undefined;
    }
    return resourcePreset.trim() || undefined;
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const resourceColumn = resolveResourceColumn();
    if (isWeaponResource && !resourceColumn) return;

    onSave(
      createFeatureDef({
        id: initial?.id,
        name: trimmed,
        description: description.trim(),
        upgradesFromId: upgradesFromId || undefined,
        resourceColumn,
        automation: resourceColumn ? undefined : automation,
      }),
    );
    onOpenChange(false);
  }

  const selectedSource = upgradesFromId
    ? findFeatureDefById(upgradeCandidates, upgradesFromId)
    : undefined;

  const resourceColumnValid =
    !isWeaponResource ||
    (resourcePreset === CUSTOM_COLUMN_VALUE
      ? customResourceColumn.trim().length > 0
      : true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[400px] w-[min(96vw,56rem)] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {title ?? (initial ? "Edit feature" : "Add feature")}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="feat-name">Feature name</Label>
              <Input
                id="feat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Charged Slash"
              />
            </div>

            {(candidates.length > 0 || upgradesFromId) && (
              <div className="space-y-1.5">
                <Label htmlFor="feat-upgrade">
                  Upgrades feature (optional)
                </Label>
                <Select
                  id="feat-upgrade"
                  value={upgradesFromId}
                  onChange={(e) => setUpgradesFromId(e.target.value)}
                  className="h-9"
                >
                  <option value="">None — standalone feature</option>
                  {candidates.map((feat) => (
                    <option key={feat.id} value={feat.id}>
                      {feat.name}
                    </option>
                  ))}
                  {upgradesFromId &&
                    !candidates.some((f) => f.id === upgradesFromId) && (
                      <option value={upgradesFromId}>
                        {selectedSource?.name ?? "Removed feature"}
                      </option>
                    )}
                </Select>
                {selectedSource && (
                  <p className="text-xs text-muted-foreground">
                    This feature replaces or improves{" "}
                    <span className="font-medium text-foreground">
                      {selectedSource.name}
                    </span>{" "}
                    at this rarity. The display name can differ from the source.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 rounded-md border border-border/70 p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={isWeaponResource}
                  onCheckedChange={(checked) =>
                    setIsWeaponResource(checked === true)
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="text-sm font-medium">Weapon resource</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Unlock under Phials, Coatings, Ammo, Notes, or a custom
                    column instead of Features.
                  </span>
                </span>
              </label>

              {isWeaponResource && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="feat-resource-type">Resource type</Label>
                  <Select
                    id="feat-resource-type"
                    value={resourcePreset}
                    onChange={(e) => setResourcePreset(e.target.value)}
                    className="h-9"
                  >
                    {RESOURCE_COLUMN_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                    <option value={CUSTOM_COLUMN_VALUE}>Custom…</option>
                  </Select>
                  {resourcePreset === CUSTOM_COLUMN_VALUE && (
                    <Input
                      value={customResourceColumn}
                      onChange={(e) => setCustomResourceColumn(e.target.value)}
                      placeholder="e.g. Available"
                      className="h-9"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feat-desc">Description</Label>
              <Textarea
                id="feat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Rules text for this feature. Line breaks and bullet lists are preserved in the weapon dialog."
              />
            </div>

            <FeatureAutomationEditor
              value={automation}
              onChange={setAutomation}
              featureName={name}
              isUpgradeLink={!!upgradesFromId}
              mergedPreviewJson={mergedPreviewJson}
              disabled={isWeaponResource}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || !resourceColumnValid}
              >
                Save feature
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
