import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_EXPERTISE_RARITY,
  INLINE_PROFICIENCY_INSTRUMENT_RARITY,
  INLINE_PROFICIENCY_SKILL_RARITY,
  INLINE_PROFICIENCY_TOOL_RARITY,
} from "../constants/material-effect.constants";

/** Infers rarity for always-on skill / tool / instrument proficiency grants. */
export function inferRarityFromProficiencyGrantTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (set.has("mechanic:expertise")) return INLINE_EXPERTISE_RARITY;
  if (set.has("mechanic:proficiency-instrument")) {
    return INLINE_PROFICIENCY_INSTRUMENT_RARITY;
  }
  if (set.has("mechanic:proficiency-tool")) return INLINE_PROFICIENCY_TOOL_RARITY;
  if (set.has("mechanic:proficiency-skill")) return INLINE_PROFICIENCY_SKILL_RARITY;
  return null;
}
