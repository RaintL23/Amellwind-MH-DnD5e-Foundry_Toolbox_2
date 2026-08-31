import type { ResourceRarity } from "@/shared/types";
import { INLINE_CONDITIONAL_SAVE_BONUS_RARITY } from "../constants/material-effect.constants";
import {
  isLimitedFlatBonus,
  rarityForFlatBonusAmount,
  stripConditionalBonusBumps,
} from "./inline-flat-bonus-rarity.utils";

/** Parses +N to all saving throws (not ability-specific). */
export function parseGenericSaveBonusAmount(text: string): number | null {
  const cleaned = stripConditionalBonusBumps(text);
  const amounts: number[] = [];

  for (const match of cleaned.matchAll(
    /\+\s*(\d+)\s*bonus\s+(?:on|to)\s+saving throws?/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  for (const match of cleaned.matchAll(
    /gain a \+\s*(\d+)\s*bonus to saving throws?/gi,
  )) {
    amounts.push(parseInt(match[1], 10));
  }

  if (amounts.length === 0) return null;
  return Math.max(...amounts);
}

/** Parses "+N bonus" on saves gated to a specific damage type or source. */
export function parseConditionalSaveBonusAmount(text: string): number | null {
  if (!/deals \w+ damage/i.test(text)) return null;
  const match = text.match(
    /saving throws?[\s\S]{0,120}?do so with (?:a )?\+\s*(\d+)\s*bonus/i,
  );
  return match ? parseInt(match[1], 10) : null;
}

/** Infers Uncommon for +N saves vs attacks/spells of a specific damage type. */
export function inferRarityFromConditionalSaveBonusTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:save-bonus")) return null;
  const amount = parseConditionalSaveBonusAmount(text);
  if (amount == null || amount < 1) return null;
  return INLINE_CONDITIONAL_SAVE_BONUS_RARITY;
}

/** Infers rarity for standing +N to all saving throws (`mechanic:save-bonus`). */
export function inferRarityFromGenericSaveBonusAmount(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:save-bonus")) return null;
  if (parseConditionalSaveBonusAmount(text) != null) return null;
  const amount = parseGenericSaveBonusAmount(text);
  if (amount == null || amount < 1) return null;
  return rarityForFlatBonusAmount(amount, isLimitedFlatBonus(tags));
}

