import { Class, ClassMetaListGroup } from "@/shared/types";
import { getCasterLabel } from "../mappers/class.mapper";
import { normalizeClassMetaGroups } from "./class-meta-list.utils";

function serializeProficiencyGroups(
  groups: ClassMetaListGroup[] | string[] | undefined,
): string {
  return normalizeClassMetaGroups(groups)
    .map((group) => `${group.label}:${group.items.join(",")}`)
    .join("\n");
}

export type ClassVariantField =
  | "hitDie"
  | "casterProgression"
  | "spellcastingAbility"
  | "proficiencies"
  | "subclassCount"
  | "startingProficiencies"
  | "startingEquipment"
  | "multiclassing"
  | "progression";

const FIELD_LABELS: Record<ClassVariantField, string> = {
  hitDie: "Hit Die",
  casterProgression: "Spellcasting",
  spellcastingAbility: "Spellcasting ability",
  proficiencies: "Saving throws",
  subclassCount: "Subclasses",
  startingProficiencies: "Starting proficiencies",
  startingEquipment: "Starting equipment",
  multiclassing: "Multiclassing",
  progression: "Level progression",
};

function fieldValue(cls: Class, field: ClassVariantField): string {
  switch (field) {
    case "hitDie":
      return cls.hitDie;
    case "casterProgression":
      return getCasterLabel(cls.casterProgression);
    case "spellcastingAbility":
      return cls.spellcastingAbility ?? "";
    case "proficiencies":
      return cls.proficiencies.join("|");
    case "subclassCount":
      return String(cls.subclasses.length);
    case "startingProficiencies":
      return serializeProficiencyGroups(cls.startingProficiencies);
    case "startingEquipment":
      return cls.startingEquipment.join("\n");
    case "multiclassing":
      return cls.multiclassing.join("\n");
    case "progression":
      return cls.progression
        .map((row) => row.features.map((f) => f.displayName).join(","))
        .join("|");
  }
}

export function getFieldsThatVaryAcrossVariants(
  variants: Class[],
): ClassVariantField[] {
  if (variants.length < 2) return [];

  const fields = Object.keys(FIELD_LABELS) as ClassVariantField[];
  return fields.filter((field) => {
    const values = new Set(variants.map((v) => fieldValue(v, field)));
    return values.size > 1;
  });
}

export function getFieldsDifferentFromVariant(
  active: Class,
  other: Class,
): ClassVariantField[] {
  const fields = Object.keys(FIELD_LABELS) as ClassVariantField[];
  return fields.filter(
    (field) => fieldValue(active, field) !== fieldValue(other, field),
  );
}

export function getVariantFieldLabel(field: ClassVariantField): string {
  return FIELD_LABELS[field];
}

export function formatClassFieldValue(
  cls: Class,
  field: ClassVariantField,
): string {
  if (field === "subclassCount") return `${cls.subclasses.length} subclasses`;
  const value = fieldValue(cls, field);
  return value || "—";
}
