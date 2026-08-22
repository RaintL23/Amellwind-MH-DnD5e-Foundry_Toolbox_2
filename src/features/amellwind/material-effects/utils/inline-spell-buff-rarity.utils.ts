import type { ResourceRarity } from "@/shared/types";
import {
  isLimitedFlatBonus,
  rarityForFlatBonusAmount,
  stripConditionalBonusBumps,
} from "./inline-flat-bonus-rarity.utils";

function hasSpellBuffTag(tags: string[]): boolean {
  return tags.some((tag) => tag.startsWith("mechanic:spell-buff"));
}

/**
 * Parses the standing +N to spell attack / spell save DC (ignores "increases to +N when").
 */
export function parseSpellBuffBonusAmount(text: string): number | null {
  const cleaned = stripConditionalBonusBumps(text);
  const amounts: number[] = [];

  for (const match of cleaned.matchAll(
    /\+\s*(\d+)\s*(?:bonus\s+)?to\s+(?:(?:your|its)\s+)?(?:[\w\s,]{0,40})?spell(?:\s+attack|\s+save)/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(/gain \+\s*(\d+) to spell attack/gi)) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(
    /(?:spell attack(?:\s+rolls?|\s+bonus)?|spell save\s*DC)(?:\s+and\s+(?:spell attack(?:\s+rolls?|\s+bonus)?|spell save\s*DC))?(?:\s+each)?\s+increase(?:s)?\s+by\s*\+?\s*(\d+)/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(
    /increase(?:s|d)?(?:\s+\w+){0,10}\s+(?:the\s+|your\s+|its\s+)?spell(?:\s+attack(?:\s+rolls?)?|\s+save\s*DC)[^.]*?\bby\s*\+?\s*(\d+)/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  if (amounts.length === 0) return null;
  return Math.max(...amounts);
}

/**
 * Infers rarity for spell attack / spell save DC bonuses (`mechanic:spell-buff:*`).
 * Same bands as AC flat bonuses (Rod of the Pact Keeper–adjacent).
 */
export function inferRarityFromSpellBuff(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!hasSpellBuffTag(tags)) return null;

  const amount = parseSpellBuffBonusAmount(text);
  if (amount == null || amount < 1) return null;

  return rarityForFlatBonusAmount(amount, isLimitedFlatBonus(tags));
}
