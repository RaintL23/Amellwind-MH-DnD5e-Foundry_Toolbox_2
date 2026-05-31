import { Weapon, WeaponRarityRow, FEATURE_COL_KEYS } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/**
 * Convierte el valor de una celda de tabla en un array de strings legibles.
 * Maneja strings con markup 5etools, tablas anidadas (Hunting Horn Notes,
 * Switch Axe Phials, Bowgun Ammo, etc.) y valores simples.
 */
function cellToStrings(cell: unknown): string[] {
  if (cell === null || cell === undefined) return [];

  if (typeof cell === "string") {
    const parsed = parseFiveToolsMarkup(cell);
    if (!parsed || parsed === "--" || parsed === "-") return [];
    // Split comma-separated entries ("Feature A, Feature B")
    return parsed
      .split(/,\s*(?=[A-Z(])/)
      .map((s) => s.trim())
      .filter((s) => s && s !== "--" && s !== "-");
  }

  if (typeof cell === "object" && cell !== null) {
    const obj = cell as Raw;
    if (obj.type === "table" && Array.isArray(obj.rows)) {
      return (obj.rows as unknown[][]).flatMap((row) =>
        row
          .map((c) => (typeof c === "string" ? parseFiveToolsMarkup(c) : ""))
          .filter((s) => s && s !== "--" && s !== "-")
      );
    }
  }

  return [];
}

/** Busca recursivamente el primer bloque { type: "inset" } en entries[]. */
function findInset(entries: unknown[]): Raw | undefined {
  for (const e of entries) {
    if (typeof e !== "object" || e === null) continue;
    const obj = e as Raw;
    if (obj.type === "inset") return obj;
    if (Array.isArray(obj.entries)) {
      const found = findInset(obj.entries as unknown[]);
      if (found) return found;
    }
  }
  return undefined;
}

function parseRarityRows(colLabels: string[], rows: unknown[][]): WeaponRarityRow[] {
  return rows.map((row) => {
    const rarity = String(row[0] ?? "Common");
    const slots = parseInt(String(row[1] ?? "1")) || 1;

    const columns: Record<string, string | string[]> = {};

    for (let i = 2; i < colLabels.length; i++) {
      const label = colLabels[i];
      const cell = row[i];
      const values = cellToStrings(cell);
      if (values.length === 0) continue;

      const isFeatureCol = FEATURE_COL_KEYS.some((k) => label.toLowerCase().includes(k));

      // Feature columns → siempre array; stats de una sola palabra → string
      if (!isFeatureCol && values.length === 1) {
        columns[label] = values[0];
      } else {
        columns[label] = values;
      }
    }

    return { rarity, slots, columns };
  });
}

/** Extrae descripción y notas adicionales de entries[] (saltando objetos como insets). */
function parseDescriptionEntries(entries: unknown[]): {
  description: string;
  supplementaryNotes: string[];
} {
  const strings = entries
    .filter((e): e is string => typeof e === "string")
    .map((e) => parseFiveToolsMarkup(e));

  return {
    description: strings[0] ?? "",
    supplementaryNotes: strings.slice(1),
  };
}

/**
 * Finds all {@optfeature Name|SOURCE} references in the top-level text entries.
 * These represent base features that apply at every rarity (e.g. Melody on
 * the Hunting Horn).
 */
function extractBaseFeatureNames(entries: unknown[]): string[] {
  const names: string[] = [];
  const pattern = /\{@optfeature ([^|}]+)/g;

  for (const e of entries) {
    if (typeof e !== "string") continue;
    let m: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(e)) !== null) {
      const name = m[1].trim();
      if (name) names.push(name);
    }
  }

  return [...new Set(names)];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapWeapon(raw: any): Weapon {
  const entries = Array.isArray(raw.entries) ? (raw.entries as unknown[]) : [];

  const inset = findInset(entries);
  let rarityRows: WeaponRarityRow[] = [];

  if (inset && Array.isArray(inset.entries)) {
    const table = (inset.entries as Raw[]).find((e) => e.type === "table");
    if (table && Array.isArray(table.colLabels) && Array.isArray(table.rows)) {
      rarityRows = parseRarityRows(table.colLabels as string[], table.rows as unknown[][]);
    }
  }

  // Extract base feature references from the inset description text
  // (features that apply at all rarities, e.g. Melody / Single Note Melody on HH)
  const insetTextEntries: unknown[] = inset && Array.isArray(inset.entries)
    ? (inset.entries as unknown[]).filter((e) => typeof e === "string")
    : [];
  const baseFeatureNames = extractBaseFeatureNames(insetTextEntries);

  const { description, supplementaryNotes } = parseDescriptionEntries(entries);

  return {
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    dmg1: String(raw.dmg1 ?? ""),
    dmg2: raw.dmg2 ? String(raw.dmg2) : undefined,
    dmgType: String(raw.dmgType ?? ""),
    properties: Array.isArray(raw.property) ? raw.property.map(String) : [],
    weight: typeof raw.weight === "number" ? raw.weight : 0,
    valueCp: typeof raw.value === "number" ? raw.value : 0,
    acBonus: typeof raw.ac === "number" ? raw.ac : undefined,
    includesShield: typeof raw.ac === "number",
    range: typeof raw.range === "string" ? raw.range : undefined,
    isFocus: raw.focus === true,
    description,
    supplementaryNotes,
    rarityRows,
    baseFeatureNames,
  };
}
