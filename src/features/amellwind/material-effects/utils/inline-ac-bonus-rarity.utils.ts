import type { ResourceRarity } from "@/shared/types";
import type { Rune } from "@/shared/types";
import {
  isLimitedFlatBonus,
  rarityForFlatBonusAmount,
  stripConditionalBonusBumps,
} from "./inline-flat-bonus-rarity.utils";

/**
 * True when AC is only used as a save replacement (Guard Up, dodge protection),
 * not a standing bonus to the wearer's armor class.
 */
export function usesAcAsSaveReplacement(text: string): boolean {
  if (
    /use your AC in place of your roll/i.test(text) &&
    /fail(?:ed|s)? a (?:Dexterity|Strength)(?:\s+or\s+(?:Dexterity|Strength))?\s+saving throw/i.test(
      text,
    )
  ) {
    return true;
  }

  return (
    /taking the dodge action/i.test(text) &&
    /Armor Class in place of making the roll/i.test(text)
  );
}

/** Whether an armor effect actually grants the wearer an AC bonus (rule 3). */
export function grantsAcBonusToWearer(rune: Rune): boolean {
  if (!rune.armorTags.includes("mechanic:armor-class")) return false;
  if (usesAcAsSaveReplacement(rune.armorEffect ?? "")) return false;
  return true;
}

/**
 * Parses the standing +N AC bonus from effect text (ignores elemental/conditional bumps).
 */
export function parseAcBonusAmount(text: string): number | null {
  const cleaned = stripConditionalBonusBumps(text);
  const amounts: number[] = [];

  for (const match of cleaned.matchAll(
    /\+\s*(\d+)\s*(?:bonus\s+)?(?:to\s+)?(?:your\s+)?(?:AC\b|armor class)/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(
    /(?:additional|extra)\s+\+\s*(\d+)\s*bonus to (?:your\s+)?AC\b/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(
    /bonus to (?:your\s+)?AC\b[^.]*?\(max\s+(\d+)\)/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(
    /(?:increasing|increase)\s+(?:your\s+)?(?:AC|armor class)\s+by\s+\+?\s*(\d+)/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(
    /gain a \+\s*(\d+)\s*bonus to (?:their\s+)?(?:AC|armor class)/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  if (amounts.length === 0) return null;
  return Math.max(...amounts);
}

/**
 * Infers rarity for AC bonuses (`mechanic:armor-class` + parseable +N).
 * Always-on +1 → Uncommon; limited/reaction +1 → Common; scales with amount.
 */
export function inferRarityFromAcBonus(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:armor-class")) return null;
  if (
    tags.includes("mechanic:degrading-ac") ||
    tags.includes("mechanic:conditional-ac")
  ) {
    return null;
  }

  const amount = parseAcBonusAmount(text);
  if (amount == null || amount < 1) return null;

  return rarityForFlatBonusAmount(amount, isLimitedFlatBonus(tags));
}
