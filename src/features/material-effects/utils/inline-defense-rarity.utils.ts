import type { DamageType, ResourceRarity } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  INLINE_DAMAGE_IMMUNITY_RARITY,
  INLINE_DAMAGE_RESISTANCE_RARITY,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";

const DAMAGE_TYPES: DamageType[] = [
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
];

export type InlineDamageDefenseKind = "resistance" | "immunity";

export interface InlineDamageDefense {
  kind: InlineDamageDefenseKind;
  types: DamageType[];
}

/**
 * Captures resistance clauses, including combined sentences:
 * "You are resistant to poison damage and immune to the poisoned condition…"
 */
const RESISTANCE_GRANT_GLOBAL =
  /(?:you\s+(?:are\s+resistant|have\s+resistance|gain\s+resistance)|(?:^|[.;]\s*|,\s*|and\s+)(?:are\s+)?resistant|(?:^|[.;]\s*|,\s*|and\s+)(?:have|gain)\s+resistance)\s+to\s+(.+?)(?=\s+and\s+(?:are\s+)?(?:immune|immunity|\w+\s+resistant)|\s+while\b|\s+when\b|[.;]|$)/gi;

/**
 * Captures damage immunity clauses even when chained after resistance:
 * "…and immune to fire damage while you wear this armor."
 */
const IMMUNITY_GRANT_GLOBAL =
  /(?:you\s+(?:are|have|gain)\s+)?(?:immune|immunity)\s+to\s+(.+?)(?=\s+and\s+(?:are\s+)?(?:resistant|immune|immunity)|\s+while\b|\s+when\b|[.;]|$)/gi;

function extractDamageTypes(fragment: string): DamageType[] {
  // "the poisoned condition" is not a damage grant.
  if (/\bcondition\b/i.test(fragment) && !/\bdamage\b/i.test(fragment)) {
    return [];
  }

  const matches: Array<{ type: DamageType; index: number }> = [];
  for (const type of DAMAGE_TYPES) {
    const damagePhrase = new RegExp(`\\b${type}\\s+damage\\b`, "i").exec(
      fragment,
    );
    if (damagePhrase && damagePhrase.index !== undefined) {
      matches.push({ type, index: damagePhrase.index });
      continue;
    }

    // Classic shorthand: "immune to poison and disease", "resistance to fire".
    // `\bpoison\b` does not match "poisoned".
    const bare = new RegExp(`\\b${type}\\b`, "i").exec(fragment);
    if (bare && bare.index !== undefined) {
      matches.push({ type, index: bare.index });
    }
  }
  return matches.sort((a, b) => a.index - b.index).map((entry) => entry.type);
}

function isNegatedContext(text: string, matchIndex: number): boolean {
  const prefix = text.slice(Math.max(0, matchIndex - 24), matchIndex).toLowerCase();
  return (
    /\bunless\s+$/.test(prefix) ||
    /\bif\s+$/.test(prefix) ||
    /\balready\s+(?:have|has)\s+$/.test(prefix) ||
    /\bignores?\s+$/.test(prefix)
  );
}

function collectGrants(
  text: string,
  pattern: RegExp,
  kind: InlineDamageDefenseKind,
): InlineDamageDefense[] {
  const defenses: InlineDamageDefense[] = [];
  for (const match of text.matchAll(pattern)) {
    if (match.index !== undefined && isNegatedContext(text, match.index)) {
      continue;
    }
    const types = extractDamageTypes(match[1] ?? "");
    if (types.length > 0) {
      defenses.push({ kind, types });
    }
  }
  return defenses;
}

/**
 * Detects first-person grants of damage resistance or immunity in rune effect text,
 * e.g. "You are immune to fire damage while you wear this armor."
 * Also handles mixed wording: "You are resistant to poison damage and immune to…"
 */
export function parseInlineDamageDefenses(text: string): InlineDamageDefense[] {
  if (!text.trim()) return [];

  const parsed = parseFiveToolsMarkup(text);
  return [
    ...collectGrants(parsed, RESISTANCE_GRANT_GLOBAL, "resistance"),
    ...collectGrants(parsed, IMMUNITY_GRANT_GLOBAL, "immunity"),
  ];
}

export function rarityForInlineDamageDefense(
  kind: InlineDamageDefenseKind,
): ResourceRarity {
  return kind === "immunity"
    ? INLINE_DAMAGE_IMMUNITY_RARITY
    : INLINE_DAMAGE_RESISTANCE_RARITY;
}

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

/** Rare for resistance, Very Rare for immunity. Immunity wins if both appear. */
export function inferInlineDamageDefenseRarity(
  text: string,
): ResourceRarity | null {
  const defenses = parseInlineDamageDefenses(text);
  if (defenses.length === 0) return null;

  return defenses.reduce<ResourceRarity>(
    (current, defense) =>
      higherRarity(current, rarityForInlineDamageDefense(defense.kind)),
    INLINE_DAMAGE_RESISTANCE_RARITY,
  );
}
