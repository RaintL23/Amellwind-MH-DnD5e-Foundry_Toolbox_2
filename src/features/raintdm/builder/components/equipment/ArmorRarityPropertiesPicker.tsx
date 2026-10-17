import type {
  AbilityKey,
  ArmorRarityProperty,
  EquippedArmor,
  SkillKey,
} from "@/shared/types";
import { ABILITY_LABELS } from "@/shared/types";
import { Select } from "@/components/ui/select";
import { ABILITY_ORDER, SKILL_LABELS, SKILL_ORDER } from "@/shared/constants/dnd";
import {
  ARMOR_RARITY_PROPERTY_LABELS,
  fitArmorRarityProperties,
} from "../../utils/armor-rarity-properties.utils";

const STEP_LABELS = ["Rare", "Very Rare", "Legendary"];

type PropertyKind = ArmorRarityProperty["kind"];

function emptyProperty(kind: PropertyKind): ArmorRarityProperty {
  switch (kind) {
    case "skills":
      return { kind, skills: [null, null] };
    case "save":
      return { kind, ability: null };
    default:
      return { kind };
  }
}

/** AGMH: one property per Rare / Very Rare / Legendary armor rarity step. */
export function ArmorRarityPropertiesPicker({
  armor,
  onChange,
}: {
  armor: EquippedArmor;
  onChange: (index: number, property: ArmorRarityProperty | null) => void;
}) {
  const properties = fitArmorRarityProperties(
    armor.rarityProperties,
    armor.rarity,
  );
  if (properties.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 rounded-md border border-border/60 bg-muted/20 p-2">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">
        Rarity properties
      </p>
      {properties.map((property, index) => (
        <div key={STEP_LABELS[index]} className="space-y-1">
          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            {STEP_LABELS[index]}
            <Select
              value={property?.kind ?? ""}
              onChange={(event) =>
                onChange(
                  index,
                  event.target.value
                    ? emptyProperty(event.target.value as PropertyKind)
                    : null,
                )
              }
              className="h-7 text-xs"
            >
              <option value="">Choose a property…</option>
              {(Object.keys(ARMOR_RARITY_PROPERTY_LABELS) as PropertyKind[]).map(
                (kind) => (
                  <option key={kind} value={kind}>
                    {ARMOR_RARITY_PROPERTY_LABELS[kind]}
                  </option>
                ),
              )}
            </Select>
          </label>
          {property?.kind === "skills" && (
            <div className="flex gap-1.5">
              {[0, 1].map((slot) => (
                <Select
                  key={slot}
                  aria-label={`Skill ${slot + 1}`}
                  value={property.skills[slot] ?? ""}
                  onChange={(event) => {
                    const skills = [...property.skills];
                    skills[slot] = (event.target.value as SkillKey) || null;
                    onChange(index, { kind: "skills", skills });
                  }}
                  className="h-7 text-xs"
                >
                  <option value="">Skill…</option>
                  {SKILL_ORDER.map((skill) => (
                    <option key={skill} value={skill}>
                      {SKILL_LABELS[skill]}
                    </option>
                  ))}
                </Select>
              ))}
            </div>
          )}
          {property?.kind === "save" && (
            <Select
              aria-label="Saving throw"
              value={property.ability ?? ""}
              onChange={(event) =>
                onChange(index, {
                  kind: "save",
                  ability: (event.target.value as AbilityKey) || null,
                })
              }
              className="h-7 text-xs"
            >
              <option value="">Saving throw…</option>
              {ABILITY_ORDER.map((ability) => (
                <option key={ability} value={ability}>
                  {ABILITY_LABELS[ability]}
                </option>
              ))}
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}
