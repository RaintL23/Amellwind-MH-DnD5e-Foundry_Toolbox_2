import type { ResourceRarity } from "@/shared/types";
import { INLINE_SPELLCASTING_FOCUS_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Common for weapon-as-spellcasting-focus grants.
 * Requires `spellcasting-focus` — distinct from casting a named spell.
 */
export function inferRarityFromSpellcastingFocusTags(
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:spellcasting-focus")) return null;
  return INLINE_SPELLCASTING_FOCUS_RARITY;
}
