import type { DamageType, ResourceRarity } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  INLINE_DAMAGE_IMMUNITY_RARITY,
  INLINE_DAMAGE_RESISTANCE_RARITY,
  INLINE_LIMITED_DAMAGE_IMMUNITY_RARITY,
  INLINE_LIMITED_DAMAGE_RESISTANCE_RARITY,
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
  /** True when the grant requires an action economy spend and/or is temporary with uses. */
  limited: boolean;
}

/**
 * Captures resistance clauses, including:
 * - always-on: "You have resistance to fire damage while you wear this armor."
 * - activated: "…use your reaction or bonus action to gain resistance to lightning…"
 */
const RESISTANCE_GRANT_GLOBAL =
  /(?:you\s+(?:are\s+resistant|have\s+resistance|gain\s+resistance)|(?:^|[.;]\s*|,\s*|and\s+)(?:are\s+)?resistant|(?:^|[.;]\s*|,\s*|and\s+|to\s+)(?:have|gain)\s+resistance)\s+to\s+(.+?)(?=\s+and\s+(?:are\s+)?(?:immune|immunity|\w+\s+resistant)|\s+while\b|\s+when\b|\s+until\b|[.;]|$)/gi;

/**
 * Captures damage immunity clauses even when chained after resistance:
 * "…and immune to fire damage while you wear this armor."
 */
const IMMUNITY_GRANT_GLOBAL =
  /(?:you\s+(?:are|have|gain)\s+)?(?:immune|immunity)\s+to\s+(.+?)(?=\s+and\s+(?:are\s+)?(?:resistant|immune|immunity)|\s+while\b|\s+when\b|\s+until\b|[.;]|$)/gi;

/** Reaction / BA / action used to gain the defense (not merely "while wearing"). */
const LIMITED_ACTIVATION =
  /(?:as an action|use (?:your |an )?action|bonus action|\breaction\b).{0,120}(?:gain |have )?(?:resistance|resistant|immunity|immune)|(?:gain |have )?(?:resistance|immunity|resistant|immune).{0,80}(?:as an action|bonus action|\breaction\b)/i;

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

export function isLimitedDefenseActivation(text: string): boolean {
  return LIMITED_ACTIVATION.test(text);
}

function collectGrants(
  text: string,
  pattern: RegExp,
  kind: InlineDamageDefenseKind,
  limited: boolean,
): InlineDamageDefense[] {
  const defenses: InlineDamageDefense[] = [];
  for (const match of text.matchAll(pattern)) {
    if (match.index !== undefined && isNegatedContext(text, match.index)) {
      continue;
    }
    const types = extractDamageTypes(match[1] ?? "");
    if (types.length > 0) {
      defenses.push({ kind, types, limited });
    }
  }
  return defenses;
}

/**
 * Detects first-person grants of damage resistance or immunity in rune effect text,
 * e.g. "You are immune to fire damage while you wear this armor."
 * Also handles activated grants: "…bonus action to gain resistance to lightning…"
 */
export function parseInlineDamageDefenses(text: string): InlineDamageDefense[] {
  if (!text.trim()) return [];

  const parsed = parseFiveToolsMarkup(text);
  const limited = isLimitedDefenseActivation(parsed);
  return [
    ...collectGrants(parsed, RESISTANCE_GRANT_GLOBAL, "resistance", limited),
    ...collectGrants(parsed, IMMUNITY_GRANT_GLOBAL, "immunity", limited),
  ];
}

export function rarityForInlineDamageDefense(
  kind: InlineDamageDefenseKind,
  limited = false,
): ResourceRarity {
  if (kind === "immunity") {
    return limited
      ? INLINE_LIMITED_DAMAGE_IMMUNITY_RARITY
      : INLINE_DAMAGE_IMMUNITY_RARITY;
  }
  return limited
    ? INLINE_LIMITED_DAMAGE_RESISTANCE_RARITY
    : INLINE_DAMAGE_RESISTANCE_RARITY;
}

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

/**
 * Always-on resistance → Rare; limited/activated resistance → Uncommon.
 * Always-on immunity → Very Rare; limited immunity → Rare.
 */
export function inferInlineDamageDefenseRarity(
  text: string,
): ResourceRarity | null {
  const defenses = parseInlineDamageDefenses(text);
  if (defenses.length === 0) return null;

  return defenses.reduce<ResourceRarity>(
    (current, defense) =>
      higherRarity(
        current,
        rarityForInlineDamageDefense(defense.kind, defense.limited),
      ),
    INLINE_LIMITED_DAMAGE_RESISTANCE_RARITY,
  );
}
