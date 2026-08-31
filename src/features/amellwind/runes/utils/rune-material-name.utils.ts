/**
 * Normalizes loot-table material names for cross-referencing effect lists,
 * catalog entries, and quantity/tier variants (x2, +, +1, trailing periods).
 */

/** Strip quantity multipliers from loot material names. */
export function stripMaterialQuantity(name: string): string {
  return name
    .replace(/^\d+\s*x\s+/i, "")
    .replace(/\s*x\s*\d+\s*$/i, "")
    .trim();
}

export interface ParsedMaterialName {
  base: string;
  /** `+`, `+1`, `+2`, … or null when absent. */
  tierSuffix: string | null;
}

/** Splits an MH material name into base title and optional tier suffix. */
export function parseMaterialNameParts(name: string): ParsedMaterialName {
  const stripped = stripMaterialQuantity(name).replace(/\.$/, "").trim();
  const plusNumber = stripped.match(/^(.+?)(\s*\+\d+)\s*$/);
  if (plusNumber) {
    return {
      base: plusNumber[1].trim(),
      tierSuffix: plusNumber[2].replace(/\s+/g, ""),
    };
  }
  const plusOnly = stripped.match(/^(.+?)(\s*\+)\s*$/);
  if (plusOnly) {
    return { base: plusOnly[1].trim(), tierSuffix: "+" };
  }
  return { base: stripped, tierSuffix: null };
}

/** Lowercase lookup key with collapsed tier spacing and no trailing period. */
export function normalizeMaterialLootName(name: string): string {
  const { base, tierSuffix } = parseMaterialNameParts(name);
  return tierSuffix ? `${base}${tierSuffix}`.toLowerCase() : base.toLowerCase();
}

/**
 * True when loot-row and effect-list names refer to the same material.
 * Allows quantity suffixes and loose tier matching (+ vs +1, or missing tier),
 * but never maps different numeric tiers (+1 vs +2).
 */
export function materialLootNamesMatch(
  lootName: string,
  effectName: string,
): boolean {
  if (normalizeMaterialLootName(lootName) === normalizeMaterialLootName(effectName)) {
    return true;
  }

  const loot = parseMaterialNameParts(lootName);
  const effect = parseMaterialNameParts(effectName);
  if (loot.base.toLowerCase() !== effect.base.toLowerCase()) return false;

  if (!loot.tierSuffix || !effect.tierSuffix) return true;
  if (loot.tierSuffix === "+" || effect.tierSuffix === "+") return true;
  return loot.tierSuffix === effect.tierSuffix;
}
