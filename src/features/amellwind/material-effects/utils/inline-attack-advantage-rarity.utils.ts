import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_ATTACK_ADVANTAGE_ALWAYS_RARITY,
  INLINE_ATTACK_ADVANTAGE_LIMITED_RARITY,
} from "../constants/material-effect.constants";

/**
 * Infers rarity for advantage on attack rolls.
 * - Limited (active / BA / reaction) → Uncommon (Aim Booster)
 * - Always-on → Rare
 */
export function inferRarityFromAttackAdvantageTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:advantage")) return null;
  if (!set.has("mechanic:attack-roll")) return null;

  const limited =
    set.has("mechanic:active") ||
    set.has("mechanic:bonus-action") ||
    set.has("mechanic:reaction");

  return limited
    ? INLINE_ATTACK_ADVANTAGE_LIMITED_RARITY
    : INLINE_ATTACK_ADVANTAGE_ALWAYS_RARITY;
}
