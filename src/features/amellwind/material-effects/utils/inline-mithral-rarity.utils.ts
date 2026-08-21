import type { ResourceRarity } from "@/shared/types";
import { INLINE_MITHRAL_ARMOR_RARITY } from "../constants/material-effect.constants";

/**
 * Infers Uncommon for Mithral Armor–style flexible armor packages.
 * Requires `mithral` — skill-stealth alone is not enough.
 */
export function inferRarityFromMithralArmorTags(
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:mithral")) return null;
  return INLINE_MITHRAL_ARMOR_RARITY;
}
