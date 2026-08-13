import type { AbilityKey, SkillKey } from "@/shared/types";

export const ABILITY_ORDER: AbilityKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

export const SKILL_ABILITY: Record<SkillKey, AbilityKey> = {
  ath: "str",
  acr: "dex",
  slt: "dex",
  ste: "dex",
  arc: "int",
  his: "int",
  inv: "int",
  rel: "int",
  nat: "int",
  dec: "cha",
  itm: "cha",
  per: "cha",
  prf: "cha",
  prc: "wis",
  ins: "wis",
  med: "wis",
  sur: "wis",
  ani: "wis",
};

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

export const SKILL_ORDER: SkillKey[] = (
  Object.keys(SKILL_LABELS) as SkillKey[]
).sort((a, b) => SKILL_LABELS[a].localeCompare(SKILL_LABELS[b]));
