import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_ANTI_TRACKING_RARITY,
  INLINE_CONDITION_SUPPRESS_RARITY,
  INLINE_CONDITIONAL_SPEED_RARITY,
  INLINE_DISENGAGE_HIDE_RARITY,
  INLINE_EXHAUSTION_RECOVERY_MAJOR_RARITY,
  INLINE_GLIDE_RARITY,
  INLINE_GRAPPLE_CONTEST_RARITY,
  INLINE_INVISIBILITY_REACTION_RARITY,
  INLINE_LANGUAGE_PROFICIENCY_RARITY,
  INLINE_PSYCHOSERUM_EXTEND_RARITY,
  INLINE_WIND_RESIST_RARITY,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

export function inferRarityFromGlideTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:glide") ? INLINE_GLIDE_RARITY : null;
}

export function inferRarityFromWindResistTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:wind-resist")
    ? INLINE_WIND_RESIST_RARITY
    : null;
}

export function inferRarityFromConditionSuppressTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:condition-suppress")
    ? INLINE_CONDITION_SUPPRESS_RARITY
    : null;
}

export function inferRarityFromLanguageProficiencyTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:proficiency-language")
    ? INLINE_LANGUAGE_PROFICIENCY_RARITY
    : null;
}

export function inferRarityFromDisengageHideTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:disengage-hide")
    ? INLINE_DISENGAGE_HIDE_RARITY
    : null;
}

export function inferRarityFromAntiTrackingTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:anti-tracking")
    ? INLINE_ANTI_TRACKING_RARITY
    : null;
}

export function inferRarityFromGrappleContestTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:grapple-contest")
    ? INLINE_GRAPPLE_CONTEST_RARITY
    : null;
}

export function inferRarityFromInvisibilityReactionTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:invisibility-reaction")
    ? INLINE_INVISIBILITY_REACTION_RARITY
    : null;
}

export function inferRarityFromExhaustionRecoveryTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:exhaustion-recovery")
    ? INLINE_EXHAUSTION_RECOVERY_MAJOR_RARITY
    : null;
}

export function inferRarityFromConditionalSpeedTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:conditional-speed")
    ? INLINE_CONDITIONAL_SPEED_RARITY
    : null;
}

export function inferRarityFromPsychoserumExtendTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:psychoserum-extend")
    ? INLINE_PSYCHOSERUM_EXTEND_RARITY
    : null;
}

/** Picks the highest rarity from utility / environment tag inferences. */
export function highestUtilityEffectRarity(
  tags: string[],
): ResourceRarity | null {
  const candidates: (ResourceRarity | null)[] = [
    inferRarityFromGlideTags(tags),
    inferRarityFromWindResistTags(tags),
    inferRarityFromConditionSuppressTags(tags),
    inferRarityFromLanguageProficiencyTags(tags),
    inferRarityFromDisengageHideTags(tags),
    inferRarityFromAntiTrackingTags(tags),
    inferRarityFromGrappleContestTags(tags),
    inferRarityFromInvisibilityReactionTags(tags),
    inferRarityFromExhaustionRecoveryTags(tags),
    inferRarityFromConditionalSpeedTags(tags),
    inferRarityFromPsychoserumExtendTags(tags),
  ];

  let best: ResourceRarity | null = null;
  for (const rarity of candidates) {
    if (!rarity) continue;
    best = best ? higherRarity(best, rarity) : rarity;
  }
  return best;
}
