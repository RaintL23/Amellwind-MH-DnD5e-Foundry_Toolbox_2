import { useCallback, useEffect, useRef, useState } from "react";
import type { Weapon } from "@/shared/types";
import {
  DMG_TYPE_LABELS,
  PROPERTY_LABELS,
} from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOptionalFeaturesMap } from "@/features/weapons/services/optionalfeature.service";
import {
  createFeatureDef,
  emptyFormValues,
  weaponToFormValues,
  type CustomWeapon,
  type WeaponForgeFeatureDef,
  type WeaponForgeFormValues,
} from "../types/weapon-forge.types";
import { mergeCopiedRarities } from "../mappers/weapon-forge.mapper";
import { getFeaturesColumnNames } from "../utils/weapon-forge-features.utils";
import { WeaponBaseSelector } from "./WeaponBaseSelector";
import { WeaponRarityEditor } from "./WeaponRarityEditor";

const PROPERTY_OPTIONS = Object.entries(PROPERTY_LABELS).map(
  ([value, label]) => ({ value, label: `${label} (${value})` }),
);

const DMG_OPTIONS = Object.entries(DMG_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface WeaponForgeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CustomWeapon | null;
  amellwindWeapons: Weapon[];
  onSave: (values: WeaponForgeFormValues, existing?: CustomWeapon) => void;
}

export function WeaponForgeForm({
  open,
  onOpenChange,
  initial,
  amellwindWeapons,
  onSave,
}: WeaponForgeFormProps) {
  const [values, setValues] = useState<WeaponForgeFormValues>(emptyFormValues());
  const valuesRef = useRef(values);
  valuesRef.current = values;

  useEffect(() => {
    if (!open) return;
    setValues(initial ? weaponToFormValues(initial) : emptyFormValues());
  }, [open, initial]);

  const patch = useCallback(<K extends keyof WeaponForgeFormValues>(
    key: K,
    value: WeaponForgeFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleChangeRows = useCallback(
    (rows: WeaponForgeFormValues["rarityRows"]) => patch("rarityRows", rows),
    [patch],
  );

  const handleChangeFeatures = useCallback(
    (features: WeaponForgeFormValues["customFeatures"]) =>
      patch("customFeatures", features),
    [patch],
  );

  const applyBase = useCallback(
    (weapon: Weapon, rarities: string[] | "all") => {
      const baseValues = weaponToFormValues(weapon);
      baseValues.rarityRows = mergeCopiedRarities(weapon, rarities);
      setValues((prev) => {
        if (prev.name.trim()) baseValues.name = prev.name;
        return baseValues;
      });

      void getOptionalFeaturesMap().then((map) => {
        const defs: WeaponForgeFeatureDef[] = [];
        const seen = new Set<string>();

        for (const row of baseValues.rarityRows) {
          for (const name of getFeaturesColumnNames(row)) {
            const key = name.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            const opt = map.get(key);
            defs.push(
              createFeatureDef({
                name,
                description: opt?.paragraphs.join("\n\n") ?? "",
              }),
            );
          }
        }

        for (const name of weapon.baseFeatureNames) {
          const key = name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          const opt = map.get(key);
          defs.push(
            createFeatureDef({
              name,
              description: opt?.paragraphs.join("\n\n") ?? "",
            }),
          );
        }

        setValues((prev) => ({ ...prev, customFeatures: defs }));
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const current = valuesRef.current;
      if (!current.name.trim()) return;
      onSave(current, initial ?? undefined);
      onOpenChange(false);
    },
    [onSave, onOpenChange, initial],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit weapon" : "Create weapon"}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <form id="weapon-forge-form" onSubmit={handleSubmit} className="space-y-6">
            <WeaponBaseSelector
              weapons={amellwindWeapons}
              onApply={applyBase}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="wf-name">Name</Label>
                <Input
                  id="wf-name"
                  value={values.name}
                  onChange={(e) => patch("name", e.target.value)}
                  required
                  placeholder="e.g. Iron Katana"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wf-dmg1">Damage die</Label>
                <Input
                  id="wf-dmg1"
                  value={values.dmg1}
                  onChange={(e) => patch("dmg1", e.target.value)}
                  placeholder="1d8"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wf-dmg2">Versatile die (optional)</Label>
                <Input
                  id="wf-dmg2"
                  value={values.dmg2}
                  onChange={(e) => patch("dmg2", e.target.value)}
                  placeholder="1d10"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Damage type</Label>
                <Select
                  value={values.dmgType}
                  onChange={(e) => patch("dmgType", e.target.value)}
                >
                  {DMG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Properties</Label>
                <MultiSelect
                  options={PROPERTY_OPTIONS}
                  selected={values.properties}
                  onChange={(next) => patch("properties", next)}
                  emptyLabel="No properties"
                  allLabel="All properties"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wf-weight">Weight (lb)</Label>
                <Input
                  id="wf-weight"
                  type="number"
                  min={0}
                  step={0.5}
                  value={values.weight}
                  onChange={(e) =>
                    patch("weight", Number.parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wf-value">Value (copper pieces)</Label>
                <Input
                  id="wf-value"
                  type="number"
                  min={0}
                  value={values.valueCp}
                  onChange={(e) =>
                    patch("valueCp", Number.parseInt(e.target.value, 10) || 0)
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  100 cp = 1 gp
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wf-ac">AC bonus (shield weapons)</Label>
                <Input
                  id="wf-ac"
                  value={values.acBonus}
                  onChange={(e) => patch("acBonus", e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wf-range">Range</Label>
                <Input
                  id="wf-range"
                  value={values.range}
                  onChange={(e) => patch("range", e.target.value)}
                  placeholder="e.g. 30/120"
                />
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="wf-focus"
                  checked={values.isFocus}
                  onCheckedChange={(checked) =>
                    patch("isFocus", checked === true)
                  }
                />
                <Label htmlFor="wf-focus" className="font-normal">
                  Spellcasting focus
                </Label>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="wf-desc">Description</Label>
                <Textarea
                  id="wf-desc"
                  value={values.description}
                  onChange={(e) => patch("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="wf-notes">
                  Supplementary notes (paragraphs separated by blank lines)
                </Label>
                <Textarea
                  id="wf-notes"
                  value={values.supplementaryNotes}
                  onChange={(e) =>
                    patch("supplementaryNotes", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="wf-base-features">
                  Base feature names (comma-separated, apply at every rarity)
                </Label>
                <Input
                  id="wf-base-features"
                  value={values.baseFeatureNames}
                  onChange={(e) => patch("baseFeatureNames", e.target.value)}
                  placeholder="Melody, Single Note Melody"
                />
              </div>
            </div>

            <WeaponRarityEditor
              rows={values.rarityRows}
              customFeatures={values.customFeatures}
              onChangeRows={handleChangeRows}
              onChangeFeatures={handleChangeFeatures}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {initial ? "Save changes" : "Create weapon"}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
