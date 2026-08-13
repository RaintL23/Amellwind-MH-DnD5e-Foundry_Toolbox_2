import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_SPELL_CAST_LEGENDARY_RARITY,
  INLINE_SPELL_CAST_RARITY_BY_LEVEL,
} from "../constants/material-effect.constants";

/**
 * Maps a spell level (0 = cantrip) to material-effect rarity for rune casts.
 * | Level | Rarity |
 * | 0–3 | Uncommon |
 * | 4–5 | Rare |
 * | 6–8 | Very Rare |
 * | 9 | Legendary |
 */
export function rarityForSpellLevel(level: number): ResourceRarity {
  const capped = Math.max(0, Math.min(9, Math.floor(level)));
  for (const band of INLINE_SPELL_CAST_RARITY_BY_LEVEL) {
    if (capped <= band.maxLevel) return band.rarity;
  }
  return INLINE_SPELL_CAST_LEGENDARY_RARITY;
}

/**
 * Infers rarity from rune mechanic tags such as `mechanic:cantrip` or
 * `mechanic:spell:lvl4`. Returns null when no spell/cantrip tags are present.
 */
export function inferRarityFromSpellMechanicTags(
  tags: string[],
): ResourceRarity | null {
  let maxLevel: number | null = null;

  for (const tag of tags) {
    if (tag === "mechanic:cantrip") {
      maxLevel = Math.max(maxLevel ?? 0, 0);
      continue;
    }
    if (tag === "mechanic:spell:lvl1-2") {
      maxLevel = Math.max(maxLevel ?? 0, 2);
      continue;
    }
    if (tag === "mechanic:spell:lvl3+") {
      maxLevel = Math.max(maxLevel ?? 0, 3);
      continue;
    }
    const match = /^mechanic:spell:lvl(\d+)$/.exec(tag);
    if (match) {
      maxLevel = Math.max(maxLevel ?? 0, parseInt(match[1], 10));
    }
  }

  if (maxLevel === null) return null;
  return rarityForSpellLevel(maxLevel);
}
