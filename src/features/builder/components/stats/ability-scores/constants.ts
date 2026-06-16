import { AbilityKey } from "@/shared/types";
import type { AbilityScoreGenerationMethod } from "../../../utils/ability-scores";

export const ABILITIES: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

export type GenerationMethod = AbilityScoreGenerationMethod;

export const ABILITY_CARD_CLASS =
  "flex flex-col items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 transition-colors";
