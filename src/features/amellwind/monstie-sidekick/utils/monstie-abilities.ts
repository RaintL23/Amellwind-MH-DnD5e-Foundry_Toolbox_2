import type { AbilityScores } from "@/shared/types";
import {
  STANDARD_ARRAY,
  ABILITY_KEYS,
} from "@/shared/utils/ability-scores";

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
