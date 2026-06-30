import type { AbilityKey, SkillKey } from "@/shared/types";

/**
 * Governing ability for each D&D 5e skill, e.g. Nature (`nat`) is tied to
 * Intelligence (`int`). Single source of truth for skill → ability mapping.
 */
export const SKILL_ABILITY: Record<SkillKey, AbilityKey> = {
  acr: "dex",
  ani: "wis",
  arc: "int",
  ath: "str",
  dec: "cha",
  his: "int",
  ins: "wis",
  itm: "cha",
  inv: "int",
  med: "wis",
  nat: "int",
  prc: "wis",
  prf: "cha",
  per: "cha",
  rel: "int",
  slt: "dex",
  ste: "dex",
  sur: "wis",
};

/** Human-readable skill labels, e.g. `ath` → `"Athletics"`. */
export const SKILL_LABELS: Record<SkillKey, string> = {
  acr: "Acrobatics",
  ani: "Animal Handling",
  arc: "Arcana",
  ath: "Athletics",
  dec: "Deception",
  his: "History",
  ins: "Insight",
  itm: "Intimidation",
  inv: "Investigation",
  med: "Medicine",
  nat: "Nature",
  prc: "Perception",
  prf: "Performance",
  per: "Persuasion",
  rel: "Religion",
  slt: "Sleight of Hand",
  ste: "Stealth",
  sur: "Survival",
};

/** All skill keys (declaration order). */
export const SKILL_KEYS: SkillKey[] = Object.keys(SKILL_LABELS) as SkillKey[];

/** Skill keys sorted alphabetically by their display label. */
export const SKILL_ORDER: SkillKey[] = [...SKILL_KEYS].sort((a, b) =>
  SKILL_LABELS[a].localeCompare(SKILL_LABELS[b]),
);

/**
 * Lower-case skill name → key, e.g. `"animal handling"` → `"ani"`.
 * Useful when parsing external data (5etools skillProficiencies, summaries…).
 */
export const SKILL_NAME_TO_KEY: Record<string, SkillKey> = {
  acrobatics: "acr",
  "animal handling": "ani",
  arcana: "arc",
  athletics: "ath",
  deception: "dec",
  history: "his",
  insight: "ins",
  intimidation: "itm",
  investigation: "inv",
  medicine: "med",
  nature: "nat",
  perception: "prc",
  performance: "prf",
  persuasion: "per",
  religion: "rel",
  "sleight of hand": "slt",
  stealth: "ste",
  survival: "sur",
};
