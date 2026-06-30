import type { AbilityScores } from "@/shared/types";
import { STANDARD_ARRAY, ABILITY_KEYS } from "@/features/builder/utils/ability-scores";
import { ABILITY_ABBREVIATIONS } from "@/shared/constants/dnd";

/** Maps the original monster's ability order onto the sidekick standard array (15,14,13,12,10,8). */
export function mapAbilitiesFromOriginal(original: AbilityScores): AbilityScores {
  const ranked = [...ABILITY_KEYS].sort((a, b) => original[b] - original[a]);
  const scores = [...STANDARD_ARRAY];
  const result = {} as AbilityScores;
  ranked.forEach((key, index) => {
    result[key] = scores[index];
  });
  return result;
}

export function formatAbilityScoresLine(abilities: AbilityScores): string {
  return ABILITY_KEYS.map(
    (k) => `${ABILITY_ABBREVIATIONS[k]} ${abilities[k]}`,
  ).join(", ");
}
