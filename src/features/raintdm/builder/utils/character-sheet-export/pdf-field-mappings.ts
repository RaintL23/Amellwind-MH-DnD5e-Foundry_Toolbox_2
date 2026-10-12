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

export interface PdfSpellRow {
  /** Suffix of the row's text fields (`SPELL NAME{n}`, `RANGE{n}`, …). */
  fieldIndex: number;
  /** Concentration / Ritual / Material diamond checkboxes on the same row. */
  c: string;
  r: string;
  m: string;
}

/**
 * Spell table rows ordered top-to-bottom as printed.
 *
 * The template numbers its text fields out of visual order (0, 1, 4, 3, 2, …)
 * and the topmost diamond row (`Check Box0/59/60`) has no text fields, so the
 * C/R/M checkboxes of text row N live on diamond row N + 1. Positions were
 * read from the widget rectangles of `dnd-2024-character-sheet.pdf`.
 */
export const PDF_SPELL_ROWS: readonly PdfSpellRow[] = (
  [
    [0, "Check Box64", "Check Box65", "Check Box66"],
    [1, "Check Box67", "Check Box68", "Check Box69"],
    [4, "Check Box70", "Check Box71", "Check Box72"],
    [3, "Check Box73", "Check Box74", "Check Box75"],
    [2, "Check Box76", "Check Box77", "Check Box78"],
    [7, "Check Box79", "Check Box80", "Check Box81"],
    [6, "Check Box85", "Check Box86", "Check Box87"],
    [5, "Check Box82", "Check Box83", "Check Box84"],
    [10, "Check Box88", "Check Box89", "Check Box90"],
    [9, "Check Box91", "Check Box92", "Check Box93"],
    [8, "Check Box94", "Check Box95", "Check Box96"],
    [13, "Check Box97", "Check Box98", "Check Box99"],
    [12, "Check Box100", "Check Box101", "Check Box102"],
    [11, "Check Box103", "Check Box104", "Check Box105"],
    [16, "Check Box106", "Check Box107", "Check Box108"],
    [15, "Check Box109", "Check Box110", "Check Box111"],
    [14, "Check Box112", "Check Box113", "Check Box114"],
    [19, "Check Box115", "Check Box116", "Check Box117"],
    [18, "Check Box118", "Check Box119", "Check Box120"],
    [17, "Check Box121", "Check Box122", "Check Box123"],
    [22, "Check Box124", "Check Box125", "Check Box126"],
    [21, "Check Box127", "Check Box128", "Check Box129"],
    [20, "Check Box130", "Check Box131", "Check Box132"],
    [25, "Check Box133", "Check Box134", "Check Box135"],
    [24, "Check Box136", "Check Box137", "Check Box138"],
    [23, "Check Box139", "Check Box140", "Check Box141"],
    [28, "Check Box142", "Check Box143", "Check Box144"],
    [27, "Check Box145", "Check Box146", "Check Box147"],
    [26, "Check Box148", "Check Box26", "Check Box150"],
  ] as const
).map(([fieldIndex, c, r, m]) => ({ fieldIndex, c, r, m }));
