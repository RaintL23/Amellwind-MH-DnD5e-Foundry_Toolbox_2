import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";

export type BestiaryVariantField =
  | "cr"
  | "crDisplay"
  | "size"
  | "type"
  | "hp"
  | "armorClass"
  | "speed"
  | "environment";

const FIELD_LABELS: Record<BestiaryVariantField, string> = {
  cr: "CR",
  crDisplay: "CR (display)",
  size: "Size",
  type: "Type",
  hp: "Hit Points",
  armorClass: "Armor Class",
  speed: "Speed",
  environment: "Environment",
};

function fieldValue(creature: BestiaryCreature, field: BestiaryVariantField): string {
  switch (field) {
    case "cr":
      return creature.cr;
    case "crDisplay":
      return creature.crDisplay;
    case "size":
      return creature.size;
    case "type":
      return `${creature.type.type}${creature.type.tags?.length ? ` (${creature.type.tags.join(", ")})` : ""}`;
    case "hp":
      return `${creature.hp.average ?? ""}|${creature.hp.formula ?? ""}`;
    case "armorClass":
      return creature.armorClass.map((a) => `${a.ac}${a.from ? `(${a.from.join(",")})` : ""}`).join("|");
    case "speed":
      return JSON.stringify(creature.speed);
    case "environment":
      return (creature.environment ?? []).join("|");
  }
}

export function getFieldsThatVaryAcrossVariants(
  variants: BestiaryCreature[],
): BestiaryVariantField[] {
  if (variants.length < 2) return [];
  const fields = Object.keys(FIELD_LABELS) as BestiaryVariantField[];
  return fields.filter((field) => {
    const values = new Set(variants.map((v) => fieldValue(v, field)));
    return values.size > 1;
  });
}

export function getFieldsDifferentFromVariant(
  active: BestiaryCreature,
  other: BestiaryCreature,
): BestiaryVariantField[] {
  const fields = Object.keys(FIELD_LABELS) as BestiaryVariantField[];
  return fields.filter((field) => fieldValue(active, field) !== fieldValue(other, field));
}

export function getVariantFieldLabel(field: BestiaryVariantField): string {
  return FIELD_LABELS[field];
}

export function formatFieldValue(creature: BestiaryCreature, field: BestiaryVariantField): string {
  return fieldValue(creature, field);
}

export function sortCreatureVariants(variants: BestiaryCreature[]): BestiaryCreature[] {
  return [...variants].sort((a, b) => a.source.localeCompare(b.source));
}
