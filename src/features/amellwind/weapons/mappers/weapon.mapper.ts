import {
  Weapon,
  WeaponRarityRow,
  isWeaponFeatureColumn,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** Lowercase optfeature key → display text, filled while mapping one weapon. */
type FeatureLabels = Record<string, string>;

const OPTFEATURE_TAG_RE = /\{@optfeature ([^|}]+)(?:\|[^|}]*)?(?:\|([^}]+))?\}/g;

/**
 * Optfeature keys in a string, in order. The display text (third tag arg) is
 * recorded in `labels` so lookups use the unique key ("Capacity Increase
 * (HBG, Very Rare)") while the UI shows "Capacity Increase".
 */
function extractOptfeatureKeys(text: string, labels: FeatureLabels): string[] {
  const keys: string[] = [];
  for (const m of text.matchAll(OPTFEATURE_TAG_RE)) {
    const key = m[1].trim();
    if (!key) continue;
    const label = m[2]?.trim();
    if (label && label.toLowerCase() !== key.toLowerCase()) {
      labels[key.toLowerCase()] = label;
    }
    keys.push(key);
  }
  return keys;
}

/**
 * Convierte el valor de una celda de tabla en un array de strings legibles.
 * Maneja strings con markup 5etools, tablas anidadas (Hunting Horn Notes,
 * Switch Axe Phials, Bowgun Ammo, etc.) y valores simples.
 */
function cellToStrings(cell: unknown, labels: FeatureLabels): string[] {
  if (cell === null || cell === undefined) return [];

  if (typeof cell === "string") {
    const keys = extractOptfeatureKeys(cell, labels);
    if (keys.length > 0) {
      const rest = cell
        .replace(OPTFEATURE_TAG_RE, "")
        .split(",")
        .flatMap((part) => cellToStrings(part.trim(), labels));
      return [...keys, ...rest];
    }
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
          .flatMap((c) => {
            if (typeof c !== "string") return [];
            const keys = extractOptfeatureKeys(c, labels);
            return keys.length > 0 ? keys : [parseFiveToolsMarkup(c)];
          })
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

/** Label for nested item tables when row cells exceed colLabels (e.g. Light Bowgun ammo list). */
function trailingUnlockLabel(colLabels: string[]): string {
  const joined = colLabels.map((l) => l.toLowerCase()).join(" ");
  if (joined.includes("coating")) return "Unlocked Coatings";
  if (joined.includes("ammo") || joined.includes("available")) return "Unlocked Ammo";
  if (joined.includes("phial")) return "Unlocked Phials";
  if (joined.includes("note")) return "Unlocked Notes";
  return "Unlocked";
}

function setColumnValue(
  columns: Record<string, string | string[]>,
  label: string,
  values: string[],
): void {
  if (values.length === 0) return;

  const isFeatureCol = isWeaponFeatureColumn(label);

  if (!isFeatureCol && values.length === 1) {
    columns[label] = values[0];
    return;
  }

  const existing = columns[label];
  if (existing) {
    const merged = [
      ...(Array.isArray(existing) ? existing : [existing]),
      ...values,
    ];
    columns[label] = merged;
    return;
  }

  columns[label] = values;
}

function parseWeaponAcBonus(raw: Raw): number | undefined {
  if (typeof raw.ac === "number") return raw.ac;
  if (typeof raw.ac === "string") {
    const parsed = Number.parseInt(raw.ac, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseRarityRows(
  colLabels: string[],
  rows: unknown[][],
  labels: FeatureLabels,
): WeaponRarityRow[] {
  const extraLabel =
    rows.some((row) => row.length > colLabels.length)
      ? trailingUnlockLabel(colLabels)
      : null;

  return rows.map((row) => {
    const rarity = String(row[0] ?? "Common");
    const slots = parseInt(String(row[1] ?? "1")) || 1;

    const columns: Record<string, string | string[]> = {};

    for (let i = 2; i < colLabels.length; i++) {
      setColumnValue(columns, colLabels[i], cellToStrings(row[i], labels));
    }

    if (extraLabel) {
      for (let i = colLabels.length; i < row.length; i++) {
        setColumnValue(columns, extraLabel, cellToStrings(row[i], labels));
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
function extractBaseFeatureNames(
  entries: unknown[],
  labels: FeatureLabels,
): string[] {
  const names = entries
    .filter((e): e is string => typeof e === "string")
    .flatMap((e) => extractOptfeatureKeys(e, labels));
  return [...new Set(names)];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapWeapon(raw: any): Weapon {
  const entries = Array.isArray(raw.entries) ? (raw.entries as unknown[]) : [];

  const inset = findInset(entries);
  let rarityRows: WeaponRarityRow[] = [];
  const featureLabels: FeatureLabels = {};

  if (inset && Array.isArray(inset.entries)) {
    const table = (inset.entries as Raw[]).find((e) => e.type === "table");
    if (table && Array.isArray(table.colLabels) && Array.isArray(table.rows)) {
      rarityRows = parseRarityRows(
        table.colLabels as string[],
        table.rows as unknown[][],
        featureLabels,
      );
    }
  }

  // Extract base feature references from the inset description text
  // (features that apply at all rarities, e.g. Melody / Single Note Melody on HH)
  const insetTextEntries: unknown[] = inset && Array.isArray(inset.entries)
    ? (inset.entries as unknown[]).filter((e) => typeof e === "string")
    : [];
  const baseFeatureNames = extractBaseFeatureNames(
    insetTextEntries,
    featureLabels,
  );

  const { description, supplementaryNotes } = parseDescriptionEntries(entries);
  const acBonus = parseWeaponAcBonus(raw);

  return {
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "AGMH"),
    contentSource: "amellwind",
    page: typeof raw.page === "number" ? raw.page : undefined,
    dmg1: String(raw.dmg1 ?? ""),
    dmg2: raw.dmg2 ? String(raw.dmg2) : undefined,
    dmgType: String(raw.dmgType ?? ""),
    properties: Array.isArray(raw.property) ? raw.property.map(String) : [],
    weight: typeof raw.weight === "number" ? raw.weight : 0,
    valueCp: typeof raw.value === "number" ? raw.value : 0,
    acBonus,
    includesShield: acBonus !== undefined,
    range: typeof raw.range === "string" ? raw.range : undefined,
    isFocus: raw.focus === true,
    description,
    supplementaryNotes,
    rarityRows,
    baseFeatureNames,
    ...(Object.keys(featureLabels).length > 0 ? { featureLabels } : {}),
  };
}
