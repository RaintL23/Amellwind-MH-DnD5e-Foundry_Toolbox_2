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

const RESISTANCE_GRANT =
  /\byou\s+(?:have|gain)\s+resistance\s+to\s+(.+?)(?:\s+while|\s+when|$)/i;

const IMMUNITY_GRANT =
  /\byou\s+(?:are|have|gain)\s+(?:immune|immunity)\s+to\s+(.+?)(?:\s+while|\s+when|$)/i;

function extractDamageTypes(fragment: string): DamageType[] {
  const matches: Array<{ type: DamageType; index: number }> = [];
  for (const type of DAMAGE_TYPES) {
    const match = new RegExp(`\\b${type}\\b`, "i").exec(fragment);
    if (match && match.index !== undefined) {
      matches.push({ type, index: match.index });
    }
  }
  return matches.sort((a, b) => a.index - b.index).map((entry) => entry.type);
}

function isConditionalOrNegatedGrant(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  return (
    /^(if|unless)\b/.test(lower) ||
    /\balready\s+(?:have|has)\b/.test(lower) ||
    /\bignores?\s+resistance\b/.test(lower) ||
    /\bunless\s+(?:it|you|they|the)\b/.test(lower)
  );
}

/**
 * Detects first-person grants of damage resistance or immunity in rune effect text,
 * e.g. "You are immune to fire damage while you wear this armor."
 */
export function parseInlineDamageDefenses(text: string): InlineDamageDefense[] {
  if (!text.trim()) return [];

  const parsed = parseFiveToolsMarkup(text);
  const sentences = parsed.split(/(?<=[.!?])\s+|\n+/);
  const defenses: InlineDamageDefense[] = [];

  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence || isConditionalOrNegatedGrant(sentence)) continue;

    const resistanceMatch = sentence.match(RESISTANCE_GRANT);
    if (resistanceMatch) {
      const types = extractDamageTypes(resistanceMatch[1] ?? "");
      if (types.length > 0) {
        defenses.push({ kind: "resistance", types });
      }
    }

    const immunityMatch = sentence.match(IMMUNITY_GRANT);
    if (immunityMatch) {
      const types = extractDamageTypes(immunityMatch[1] ?? "");
      if (types.length > 0) {
        defenses.push({ kind: "immunity", types });
      }
    }
  }

  return defenses;
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
