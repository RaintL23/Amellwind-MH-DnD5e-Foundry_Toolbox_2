import { DMG_TYPE_LABELS, PROPERTY_LABELS } from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import {
  createDefaultForgeModes,
  syncDamageFromModes,
} from "@/features/weapons/utils/weapon-mode.utils";
import type { WeaponForgeFormValues } from "../types/weapon-forge.types";
import { WeaponModesEditor } from "./WeaponModesEditor";

const PROPERTY_OPTIONS = Object.entries(PROPERTY_LABELS).map(
  ([value, label]) => ({ value, label: `${label} (${value})` }),
);

const DMG_OPTIONS = Object.entries(DMG_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface WeaponForgeBasicsFieldsProps {
  values: WeaponForgeFormValues;
  onPatch: <K extends keyof WeaponForgeFormValues>(
    key: K,
    value: WeaponForgeFormValues[K],
  ) => void;
  onPatchMany: (partial: Partial<WeaponForgeFormValues>) => void;
}

export function WeaponForgeBasicsFields({
  values,
  onPatch,
  onPatchMany,
}: WeaponForgeBasicsFieldsProps) {
  const isVersatile = values.properties.includes("V");
  const hasModes = !isVersatile && values.modes.length >= 2;

  const handlePropertiesChange = (next: string[]) => {
    const nextIsVersatile = next.includes("V");
    if (nextIsVersatile && values.modes.length > 0) {
      onPatchMany({ properties: next, modes: [] });
      return;
    }
    onPatch("properties", next);
  };

  const enableModes = () => {
    const seeded = createDefaultForgeModes(
      values.dmg1 || "1d8",
      values.dmg2 || values.dmg1 || "1d8",
    );
    const synced = syncDamageFromModes(seeded);
    onPatchMany({
      modes: seeded,
      dmg1: synced.dmg1,
      dmg2: synced.dmg2 ?? "",
      properties: values.properties.filter((p) => p !== "V"),
    });
  };

  const clearModes = () => {
    onPatchMany({ modes: [], dmg2: "" });
  };

  const handleModesChange = (modes: WeaponForgeFormValues["modes"]) => {
    const synced = syncDamageFromModes(modes);
    onPatchMany({
      modes,
      dmg1: synced.dmg1,
      dmg2: synced.dmg2 ?? "",
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="wf-name">Name</Label>
        <Input
          id="wf-name"
          value={values.name}
          onChange={(e) => onPatch("name", e.target.value)}
          required
          placeholder="e.g. Iron Katana"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wf-author">Author</Label>
        <Input
          id="wf-author"
          value={values.author}
          onChange={(e) => onPatch("author", e.target.value)}
          placeholder="e.g. RaintDM"
        />
        <p className="text-[11px] text-muted-foreground">
          Who created this variant (RaintDM, community author, etc.).
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>Properties</Label>
        <MultiSelect
          options={PROPERTY_OPTIONS}
          selected={values.properties}
          onChange={handlePropertiesChange}
          emptyLabel="No properties"
          allLabel="All properties"
        />
      </div>

      {isVersatile ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="wf-dmg1">Damage die (one-hand)</Label>
            <Input
              id="wf-dmg1"
              value={values.dmg1}
              onChange={(e) => onPatch("dmg1", e.target.value)}
              placeholder="1d8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wf-dmg2">Versatile die (two-hand)</Label>
            <Input
              id="wf-dmg2"
              value={values.dmg2}
              onChange={(e) => onPatch("dmg2", e.target.value)}
              placeholder="1d10"
            />
          </div>
        </>
      ) : hasModes ? (
        <WeaponModesEditor modes={values.modes} onChange={handleModesChange} />
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="wf-dmg1">Damage die</Label>
            <Input
              id="wf-dmg1"
              value={values.dmg1}
              onChange={(e) => onPatch("dmg1", e.target.value)}
              placeholder="1d8"
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={enableModes}>
              Add weapon modes
            </Button>
            <p className="text-[11px] text-muted-foreground">
              For Switch Axe, Charge Blade, etc. (not Versatile).
            </p>
          </div>
        </>
      )}

      {hasModes && (
        <div className="sm:col-span-3">
          <Button type="button" variant="ghost" size="sm" onClick={clearModes}>
            Remove modes (single damage die)
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Damage type</Label>
        <Select
          value={values.dmgType}
          onChange={(e) => onPatch("dmgType", e.target.value)}
        >
          {DMG_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
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
            onPatch("weight", Number.parseFloat(e.target.value) || 0)
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
            onPatch("valueCp", Number.parseInt(e.target.value, 10) || 0)
          }
        />
        <p className="text-[11px] text-muted-foreground">100 cp = 1 gp</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wf-ac">AC bonus (shield weapons)</Label>
        <Input
          id="wf-ac"
          value={values.acBonus}
          onChange={(e) => onPatch("acBonus", e.target.value)}
          placeholder="e.g. 2"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wf-range">Range</Label>
        <Input
          id="wf-range"
          value={values.range}
          onChange={(e) => onPatch("range", e.target.value)}
          placeholder="e.g. 30/120"
        />
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Checkbox
          id="wf-focus"
          checked={values.isFocus}
          onCheckedChange={(checked) => onPatch("isFocus", checked === true)}
        />
        <Label htmlFor="wf-focus" className="font-normal">
          Spellcasting focus
        </Label>
      </div>

      <div className="sm:col-span-3 space-y-1.5">
        <Label htmlFor="wf-desc">Description</Label>
        <Textarea
          id="wf-desc"
          value={values.description}
          onChange={(e) => onPatch("description", e.target.value)}
          rows={3}
        />
      </div>

      <div className="sm:col-span-3 space-y-1.5">
        <Label htmlFor="wf-notes">
          Supplementary notes (paragraphs separated by blank lines)
        </Label>
        <Textarea
          id="wf-notes"
          value={values.supplementaryNotes}
          onChange={(e) => onPatch("supplementaryNotes", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
