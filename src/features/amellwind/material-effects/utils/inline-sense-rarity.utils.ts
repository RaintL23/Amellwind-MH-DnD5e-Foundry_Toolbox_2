import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_BLINDSIGHT_MAJOR_RARITY,
  INLINE_BLINDSIGHT_MINOR_RARITY,
  INLINE_TRUESIGHT_ALWAYS_RARITY,
  INLINE_TRUESIGHT_LIMITED_RARITY,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

function parseSenseRange(text: string, sense: string): number {
  const match = text.match(new RegExp(`${sense} out to (\\d+)`, "i"));
  return match ? parseInt(match[1], 10) : 10;
}

/** Infers rarity for blindsight / truesight / tremorsense equipment grants. */
export function inferRarityFromSpecialSenseTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  let best: ResourceRarity | null = null;

  if (set.has("mechanic:blindsight")) {
    const range = parseSenseRange(text, "blindsight");
    const rarity =
      range <= 10 ? INLINE_BLINDSIGHT_MINOR_RARITY : INLINE_BLINDSIGHT_MAJOR_RARITY;
    best = best ? higherRarity(best, rarity) : rarity;
  }

  if (set.has("mechanic:tremorsense")) {
    const range = parseSenseRange(text, "tremorsense");
    const rarity =
      range <= 30 ? INLINE_BLINDSIGHT_MINOR_RARITY : INLINE_BLINDSIGHT_MAJOR_RARITY;
    best = best ? higherRarity(best, rarity) : rarity;
  }

  if (set.has("mechanic:truesight")) {
    const limited =
      set.has("mechanic:active") ||
      set.has("mechanic:long-rest") ||
      /\bfor 1 hour\b/i.test(text);
    const rarity = limited
      ? INLINE_TRUESIGHT_LIMITED_RARITY
      : INLINE_TRUESIGHT_ALWAYS_RARITY;
    best = best ? higherRarity(best, rarity) : rarity;
  }

  return best;
}
