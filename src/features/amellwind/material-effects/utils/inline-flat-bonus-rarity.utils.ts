import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_FLAT_BONUS_ALWAYS_RARITY,
  INLINE_FLAT_BONUS_LIMITED_RARITY,
} from "../constants/material-effect.constants";

/** Maps a flat +N bonus to rarity (Cloak of Protection / Rod of the Pact Keeper). */
export function rarityForFlatBonusAmount(
  amount: number,
  limited: boolean,
): ResourceRarity {
  const table = limited
    ? INLINE_FLAT_BONUS_LIMITED_RARITY
    : INLINE_FLAT_BONUS_ALWAYS_RARITY;
  const idx = Math.min(Math.max(1, Math.floor(amount)), table.length - 1);
  return table[idx];
}

/** Limited when the effect spends action economy or is otherwise activated. */
export function isLimitedFlatBonus(tags: string[]): boolean {
  const set = new Set(tags);
  return (
    set.has("mechanic:active") ||
    set.has("mechanic:bonus-action") ||
    set.has("mechanic:reaction")
  );
}

/**
 * Drops "this bonus increases to +N when…" bumps so standing +1/+2 drives rarity.
 */
export function stripConditionalBonusBumps(text: string): string {
  return text
    .replace(/this bonus increases to \+\s*\d+\s+when[^.]*\.?/gi, " ")
    .replace(
      /if the spell deals[^,]{0,40},\s*the bonus is increased to \+\s*\d+/gi,
      " ",
    );
}
