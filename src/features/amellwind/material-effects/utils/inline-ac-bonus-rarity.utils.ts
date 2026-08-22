import type { ResourceRarity } from "@/shared/types";
import {
  isLimitedFlatBonus,
  rarityForFlatBonusAmount,
  stripConditionalBonusBumps,
} from "./inline-flat-bonus-rarity.utils";

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

  const amount = parseAcBonusAmount(text);
  if (amount == null || amount < 1) return null;

  return rarityForFlatBonusAmount(amount, isLimitedFlatBonus(tags));
}
