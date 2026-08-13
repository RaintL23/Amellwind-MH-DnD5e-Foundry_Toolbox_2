/** D&D 2024 sheet alignment grid (3×3 checkbox cluster). */
export const PDF_ALIGNMENT_CHECKBOX: Record<string, string> = {
  LG: "Check Box46",
  NG: "Check Box53",
  CG: "Check Box56",
  LN: "Check Box43",
  N: "Check Box45",
  CN: "Check Box58",
  LE: "Check Box44",
  NE: "Check Box54",
  CE: "Check Box57",
};

/** D&D 2024 sheet armor training row (Light → Shields, left to right). */
export const PDF_ARMOR_TRAINING_CHECKBOXES = {
  light: "Check Box33",
  medium: "Check Box34",
  heavy: "Check Box35",
  shields: "Check Box36",
} as const;

export type ArmorTrainingCategory = keyof typeof PDF_ARMOR_TRAINING_CHECKBOXES;

function normalizeArmorTrainingKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+armor$/, "");
}

export function getArmorTrainingProficiencies(
  armorItems: string[],
): Partial<Record<ArmorTrainingCategory, boolean>> {
  const keys = new Set(armorItems.map(normalizeArmorTrainingKey));
  const result: Partial<Record<ArmorTrainingCategory, boolean>> = {};
  if (keys.has("light")) result.light = true;
  if (keys.has("medium")) result.medium = true;
  if (keys.has("heavy")) result.heavy = true;
  if (keys.has("shield") || keys.has("shields")) result.shields = true;
  return result;
}

export function resolveAlignmentCode(alignment: string[]): string {
  const code = alignment[0] ?? "N";
  return PDF_ALIGNMENT_CHECKBOX[code] ? code : "N";
}

export function getAlignmentCheckboxField(alignment: string[]): string | undefined {
  return PDF_ALIGNMENT_CHECKBOX[resolveAlignmentCode(alignment)];
}
