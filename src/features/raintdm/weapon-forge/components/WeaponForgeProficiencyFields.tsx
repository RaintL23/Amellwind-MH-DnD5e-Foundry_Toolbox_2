import { GraduationCap, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import {
  COMPATIBLE_PROFICIENCY_OPTIONS,
} from "@/features/amellwind/weapons/data/weapon-proficiencies.data";
import type {
  WeaponProficiencyRange,
  WeaponProficiencyTier,
} from "@/shared/types";
import type { WeaponForgeFormValues } from "../types/weapon-forge.types";

const RANGE_OPTIONS: { value: WeaponProficiencyRange; label: string }[] = [
  { value: "melee", label: "Melee" },
  { value: "ranged", label: "Ranged" },
];

const TIER_OPTIONS: { value: WeaponProficiencyTier; label: string }[] = [
  { value: "martial", label: "Martial" },
  { value: "simple", label: "Simple" },
  { value: "martial-or-simple", label: "Martial/Simple" },
];

const PROFICIENCY_OPTIONS = COMPATIBLE_PROFICIENCY_OPTIONS.map((name) => ({
  value: name,
  label: name,
}));

interface WeaponForgeProficiencyFieldsProps {
  values: WeaponForgeFormValues;
  onPatch: <K extends keyof WeaponForgeFormValues>(
    key: K,
    value: WeaponForgeFormValues[K],
  ) => void;
  onPatchMany: (partial: Partial<WeaponForgeFormValues>) => void;
  /** When true, integrated shield is configured per mode — hide the weapon-wide toggle. */
  hasModes?: boolean;
}

export function WeaponForgeProficiencyFields({
  values,
  onPatch,
  onPatchMany,
  hasModes = false,
}: WeaponForgeProficiencyFieldsProps) {
  const modesWithShield = values.modes.filter((m) => m.hasShield === true);
  const anyModeHasShield = modesWithShield.length > 0;

  const handleIncludesShield = (checked: boolean) => {
    if (checked) {
      onPatchMany({
        includesShield: true,
        acBonus: values.acBonus.trim() || "2",
        requiresShieldProficiency: true,
      });
      return;
    }
    onPatchMany({
      includesShield: false,
      acBonus: "",
      requiresShieldProficiency: false,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-800/40 bg-amber-950/20 px-3 py-3">
        <div className="flex items-start gap-2">
          <GraduationCap
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
                D&D Weapon Category
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="wf-prof-range" className="text-xs font-normal">
                    Range
                  </Label>
                  <Select
                    id="wf-prof-range"
                    value={values.proficiencyRange}
                    onChange={(e) =>
                      onPatch(
                        "proficiencyRange",
                        e.target.value as WeaponProficiencyRange,
                      )
                    }
                  >
                    {RANGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wf-prof-tier" className="text-xs font-normal">
                    Tier
                  </Label>
                  <Select
                    id="wf-prof-tier"
                    value={values.proficiencyTier}
                    onChange={(e) =>
                      onPatch(
                        "proficiencyTier",
                        e.target.value as WeaponProficiencyTier,
                      )
                    }
                  >
                    {TIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
                Compatible Proficiency
              </p>
              <MultiSelect
                options={PROFICIENCY_OPTIONS}
                selected={values.compatibleProficiencies}
                onChange={(next) => onPatch("compatibleProficiencies", next)}
                emptyLabel="No proficiencies"
                allLabel="All listed"
                searchable
                searchPlaceholder="Search weapons…"
              />
              <div className="flex items-center gap-2 pt-0.5">
                <Checkbox
                  id="wf-req-shield"
                  checked={values.requiresShieldProficiency}
                  onCheckedChange={(checked) =>
                    onPatch("requiresShieldProficiency", checked === true)
                  }
                />
                <Label htmlFor="wf-req-shield" className="font-normal text-xs">
                  Also requires Shield proficiency
                </Label>
              </div>
              <p className="text-[11px] italic leading-snug text-muted-foreground/80">
                {values.requiresShieldProficiency
                  ? "Requires Shield proficiency and proficiency in one of the weapons above."
                  : "Requires proficiency in one of the weapons above."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-teal-800/40 bg-teal-950/20 px-3 py-3">
        <div className="flex items-start gap-2">
          <Shield
            className="mt-0.5 h-4 w-4 shrink-0 text-teal-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-3">
            {hasModes ? (
              <>
                <div>
                  <p className="font-medium text-teal-200">
                    Integrated shield (per mode)
                    {anyModeHasShield && values.acBonus.trim()
                      ? ` (+${values.acBonus.trim()} AC base)`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-teal-100/80 leading-relaxed">
                    Each mode can include a shield independently — e.g. Charge
                    Blade Sword has one, Axe mode does not. Toggle{" "}
                    <span className="font-medium text-teal-100">
                      Integrated shield
                    </span>{" "}
                    on the mode cards above.
                  </p>
                  {anyModeHasShield ? (
                    <p className="mt-1.5 text-[11px] text-teal-200/90">
                      Active on:{" "}
                      {modesWithShield
                        .map((m) => m.label.trim() || "Unnamed mode")
                        .join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      No mode currently includes a shield.
                    </p>
                  )}
                </div>

                {anyModeHasShield && (
                  <>
                    <div className="max-w-[10rem] space-y-1">
                      <Label htmlFor="wf-ac" className="text-xs font-normal">
                        Base AC bonus
                      </Label>
                      <Input
                        id="wf-ac"
                        value={values.acBonus}
                        onChange={(e) => onPatch("acBonus", e.target.value)}
                        placeholder="2"
                        inputMode="numeric"
                      />
                    </div>
                    <p className="text-xs text-teal-100/80 leading-relaxed">
                      While a shield mode is active, the shield occupies your
                      off-hand and cannot be swapped separately. Extra AC from
                      the rarity table applies while the shield is equipped.
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="wf-includes-shield"
                    checked={values.includesShield}
                    onCheckedChange={(checked) =>
                      handleIncludesShield(checked === true)
                    }
                  />
                  <Label
                    htmlFor="wf-includes-shield"
                    className="font-medium text-teal-200"
                  >
                    Includes an integrated shield
                    {values.includesShield && values.acBonus.trim()
                      ? ` (+${values.acBonus.trim()} AC base)`
                      : ""}
                  </Label>
                </div>

                {values.includesShield && (
                  <>
                    <div className="max-w-[10rem] space-y-1">
                      <Label htmlFor="wf-ac" className="text-xs font-normal">
                        Base AC bonus
                      </Label>
                      <Input
                        id="wf-ac"
                        value={values.acBonus}
                        onChange={(e) => onPatch("acBonus", e.target.value)}
                        placeholder="2"
                        inputMode="numeric"
                      />
                    </div>
                    <p className="text-xs text-teal-100/80 leading-relaxed">
                      The shield occupies your off-hand and cannot be swapped
                      separately. Extra AC from the rarity table applies while
                      the shield is equipped.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
