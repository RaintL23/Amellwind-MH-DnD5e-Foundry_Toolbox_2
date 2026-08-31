import type { DamageType } from "@/shared/types";

export const CANONICAL_DAMAGE_TYPES: readonly DamageType[] = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const;

/** Classic elemental damage types (acid, cold, fire, lightning, thunder). */
export const ELEMENTAL_DAMAGE_TYPES: readonly DamageType[] = [
  "acid",
  "cold",
  "fire",
  "lightning",
  "thunder",
] as const;

/** MHMM source typos / informal labels mapped to 5e damage types. */
export const DAMAGE_TYPE_TEXT_ALIASES: Record<string, DamageType> = {
  lighting: "lightning",
};

export function normalizeDamageTypeWord(word: string): DamageType | null {
  const lower = word.trim().toLowerCase();
  const canonical = DAMAGE_TYPE_TEXT_ALIASES[lower] ?? lower;
  return (CANONICAL_DAMAGE_TYPES as readonly string[]).includes(canonical)
    ? (canonical as DamageType)
    : null;
}

/** Replaces known alias tokens so downstream regexes can use canonical type names. */
export function normalizeDamageTypeAliasesInText(text: string): string {
  let result = text;
  for (const [alias, canonical] of Object.entries(DAMAGE_TYPE_TEXT_ALIASES)) {
    result = result.replace(new RegExp(`\\b${alias}\\b`, "gi"), canonical);
  }
  return result;
}

function firstMatchIndex(text: string, pattern: RegExp): number | null {
  const match = pattern.exec(text);
  return match?.index ?? null;
}

function addType(
  found: Map<DamageType, number>,
  type: DamageType,
  index: number,
): void {
  const existing = found.get(type);
  if (existing === undefined || index < existing) {
    found.set(type, index);
  }
}

/**
 * Pulls every canonical damage type referenced in rune / material-effect prose:
 * explicit "{type} damage", defense grants, shared-suffix lists, flat DR, etc.
 */
export function extractAllDamageTypesFromText(text: string): DamageType[] {
  if (!text.trim()) return [];

  const normalized = normalizeDamageTypeAliasesInText(text);
  const found = new Map<DamageType, number>();

  for (const type of CANONICAL_DAMAGE_TYPES) {
    const escaped = type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const directDamage = firstMatchIndex(
      normalized,
      new RegExp(`\\b${escaped}\\s+damage\\b`, "i"),
    );
    if (directDamage !== null) {
      addType(found, type, directDamage);
      continue;
    }

    const defenseTo = firstMatchIndex(
      normalized,
      new RegExp(
        `(?:resist(?:ant|ance)s?|immune(?:ity)?|vulnerab(?:le|ility))\\s+to\\s+${escaped}\\b`,
        "i",
      ),
    );
    if (defenseTo !== null) {
      addType(found, type, defenseTo);
      continue;
    }

    const mhmmResistances = firstMatchIndex(
      normalized,
      new RegExp(`(?:have|gain)\\s+resistances?\\s+${escaped}\\b`, "i"),
    );
    if (mhmmResistances !== null) {
      addType(found, type, mhmmResistances);
      continue;
    }

    const flatReduction = firstMatchIndex(
      normalized,
      new RegExp(`reduce\\s+${escaped}\\s+damage`, "i"),
    );
    if (flatReduction !== null) {
      addType(found, type, flatReduction);
    }
  }

  for (const match of normalized.matchAll(
    /(?:resist(?:ant|ance)s?|resistances?|immune(?:ity)?|vulnerab(?:le|ility))\s+(?:to\s+)?([^.]+?\bdamage\b)/gi,
  )) {
    const fragment = match[1] ?? "";
    const baseIndex = match.index ?? 0;
    for (const type of extractDamageTypesFromFragment(fragment)) {
      addType(found, type, baseIndex);
    }
  }

  for (const match of normalized.matchAll(
    /(?:immune|immunity)\s+to\s+([^.]+?)(?=\s+and\s+(?:resistant|resistance|immune|immunity)|\s+while\b|\s+when\b|[.;]|$)/gi,
  )) {
    const fragment = match[1] ?? "";
    const baseIndex = match.index ?? 0;
    if (!/\bdamage\b/i.test(fragment)) {
      for (const type of extractDamageTypesFromFragment(fragment)) {
        addType(found, type, baseIndex);
      }
    }
  }

  for (const type of extractDamageTypesFromDealsClause(normalized)) {
    addType(found, type, 0);
  }

  return CANONICAL_DAMAGE_TYPES.filter((type) => found.has(type));
}

/** "deals cold, fire, lightning, or necrotic damage" — Elemental Atk Up, etc. */
export function extractDamageTypesFromDealsClause(text: string): DamageType[] {
  const match = /deals?\s+([^.;\n]+?\bdamage\b)/i.exec(text);
  if (!match) return [];

  const clause = match[1].replace(/\s+damage\b/i, "");
  const parts = clause.split(/\s*,\s*|\s+or\s+/i);
  const types: DamageType[] = [];

  for (const part of parts) {
    const type = normalizeDamageTypeWord(part.trim());
    if (type && !types.includes(type)) types.push(type);
  }

  return types;
}

export function mentionsDamageTypeInText(
  text: string,
  type: DamageType,
): boolean {
  return extractAllDamageTypesFromText(text).includes(type);
}

/**
 * Pulls damage types from a resistance/immunity clause fragment, e.g.
 * "fire and cold damage", "lightning", "poison and disease".
 */
export function extractDamageTypesFromFragment(fragment: string): DamageType[] {
  if (/\bcondition\b/i.test(fragment) && !/\bdamage\b/i.test(fragment)) {
    return [];
  }

  const normalized = normalizeDamageTypeAliasesInText(fragment);
  const matches: Array<{ type: DamageType; index: number }> = [];

  for (const type of CANONICAL_DAMAGE_TYPES) {
    const escaped = type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const damagePhrase = new RegExp(`\\b${escaped}\\s+damage\\b`, "i").exec(
      normalized,
    );
    if (damagePhrase?.index !== undefined) {
      matches.push({ type, index: damagePhrase.index });
      continue;
    }

    const bare = new RegExp(`\\b${escaped}\\b`, "i").exec(normalized);
    if (bare?.index !== undefined) {
      matches.push({ type, index: bare.index });
    }
  }

  return matches
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.type);
}
