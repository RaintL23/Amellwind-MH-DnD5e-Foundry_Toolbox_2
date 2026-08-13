import { memo } from "react";
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
import type { WeaponForgeFeatureDef } from "@/features/raintdm/weapon-forge/types/weapon-forge.types";
import { createFeatureDef } from "@/features/raintdm/weapon-forge/types/weapon-forge.types";
import {
  findFeatureDefById,
  getAssignedFeaturesForRow,
  getTypedBonusValue,
  resolveFeatureDef,
  setTypedBonusValue,
} from "@/features/raintdm/weapon-forge/utils/weapon-forge-features.utils";

const RARITY_OPTIONS: readonly string[] = WEAPON_RARITY_ORDER;

function isRarityTier(value: string): value is WeaponRarityTier {
  return isWeaponRarityTier(value);
}

export interface RarityRowItemProps {
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

export const RarityRowItem = memo(function RarityRowItem({
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
