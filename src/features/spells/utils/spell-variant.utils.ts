import { Spell } from "@/shared/types";

export type SpellVariantField =
  | "level"
  | "schoolName"
  | "castingTime"
  | "range"
  | "duration"
  | "components"
  | "description"
  | "higherLevel"
  | "classes"
  | "isRitual"
  | "isConcentration";

const FIELD_LABELS: Record<SpellVariantField, string> = {
  level: "Level",
  schoolName: "School",
  castingTime: "Casting time",
  range: "Range",
  duration: "Duration",
  components: "Components",
  description: "Description",
  higherLevel: "At higher levels",
  classes: "Classes",
  isRitual: "Ritual",
  isConcentration: "Concentration",
};

function componentsKey(c: Spell["components"]): string {
  return `${c.v}|${c.s}|${c.m ?? ""}`;
}

function fieldValue(spell: Spell, field: SpellVariantField): string {
  switch (field) {
    case "level":
      return spell.level === 0 ? "Cantrip" : String(spell.level);
    case "schoolName":
      return spell.schoolName;
    case "castingTime":
      return spell.castingTime;
    case "range":
      return spell.range;
    case "duration":
      return spell.duration;
    case "components":
      return componentsKey(spell.components);
    case "description":
      return spell.description.join("\n");
    case "higherLevel":
      return spell.higherLevel ?? "";
    case "classes":
      return spell.classes.join("|");
    case "isRitual":
      return String(spell.isRitual);
    case "isConcentration":
      return String(spell.isConcentration);
  }
}

export function getFieldsThatVaryAcrossVariants(
  variants: Spell[],
): SpellVariantField[] {
  if (variants.length < 2) return [];

  const fields = Object.keys(FIELD_LABELS) as SpellVariantField[];
  return fields.filter((field) => {
    const values = new Set(variants.map((v) => fieldValue(v, field)));
    return values.size > 1;
  });
}

export function getFieldsDifferentFromVariant(
  active: Spell,
  other: Spell,
): SpellVariantField[] {
  const fields = Object.keys(FIELD_LABELS) as SpellVariantField[];
  return fields.filter((field) => fieldValue(active, field) !== fieldValue(other, field));
}

export function getVariantFieldLabel(field: SpellVariantField): string {
  return FIELD_LABELS[field];
}

export function formatFieldValue(spell: Spell, field: SpellVariantField): string {
  switch (field) {
    case "level":
      return spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
    case "components": {
      const parts: string[] = [];
      if (spell.components.v) parts.push("V");
      if (spell.components.s) parts.push("S");
      if (spell.components.m) parts.push(`M (${spell.components.m})`);
      return parts.join(", ") || "—";
    }
    case "classes":
      return spell.classes.length > 0 ? spell.classes.join(", ") : "—";
    case "isRitual":
      return spell.isRitual ? "Yes" : "No";
    case "isConcentration":
      return spell.isConcentration ? "Yes" : "No";
    case "description":
      return spell.description.length > 0 ? `${spell.description.length} paragraph(s)` : "—";
    case "higherLevel":
      return spell.higherLevel?.trim() ? "Present" : "—";
    default:
      return fieldValue(spell, field) || "—";
  }
}

export function sortSpellVariants(variants: Spell[]): Spell[] {
  return [...variants].sort((a, b) => a.source.localeCompare(b.source));
}
