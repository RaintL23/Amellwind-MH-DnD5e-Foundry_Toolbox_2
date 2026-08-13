import type { AbilityKey } from "@/shared/types";
import { ABILITY_KEYS, ABILITY_ABBREVIATIONS } from "@/shared/constants/dnd";
import type { AbilityScoreGenerationMethod } from "../../../utils/ability-scores";

export const ABILITIES: { key: AbilityKey; label: string }[] = ABILITY_KEYS.map(
  (key) => ({ key, label: ABILITY_ABBREVIATIONS[key] }),
);

export type GenerationMethod = AbilityScoreGenerationMethod;

export const ABILITY_CARD_CLASS =
  "flex flex-col items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 transition-colors";
