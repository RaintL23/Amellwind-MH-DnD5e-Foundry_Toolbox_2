import type { SkillKey } from "@/shared/types";
import type { SkillProficiencyGrant } from "@/shared/types/proficiency.types";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import { pickMultipleByRpgbot } from "./character-randomizer.utils";

const ALL_SKILL_KEYS: SkillKey[] = [
  "acr",
  "ani",
  "arc",
  "ath",
  "dec",
  "his",
  "ins",
  "itm",
  "inv",
  "med",
  "nat",
  "prc",
  "prf",
  "per",
  "rel",
  "slt",
  "ste",
  "sur",
];

export function pickSkillsFromGrant(
  grant: SkillProficiencyGrant,
  lookup: RpgbotLookupFn | null,
  exclude: Set<SkillKey>,
): SkillKey[] {
  if (grant.kind === "fixed") return [];

  const pool =
    grant.kind === "choose"
      ? grant.from.filter((skill) => !exclude.has(skill))
      : ALL_SKILL_KEYS.filter((skill) => !exclude.has(skill));

  const picked = pickMultipleByRpgbot(
    pool,
    grant.count,
    (skill) => lookup?.(skill) ?? null,
    exclude,
  );

  for (const skill of picked) {
    exclude.add(skill);
  }

  return picked;
}

export function pickAllSkillChoices(
  grants: SkillProficiencyGrant[],
  lookup: RpgbotLookupFn | null,
): SkillKey[] {
  const exclude = new Set<SkillKey>();
  const choices: SkillKey[] = [];

  for (const grant of grants) {
    choices.push(...pickSkillsFromGrant(grant, lookup, exclude));
  }

  return choices;
}

export function pickIndexedSkillChoices(
  grants: SkillProficiencyGrant[],
  lookup: RpgbotLookupFn | null,
): Record<number, SkillKey[]> {
  const exclude = new Set<SkillKey>();
  const result: Record<number, SkillKey[]> = {};

  grants.forEach((grant, index) => {
    if (grant.kind === "choose" || grant.kind === "any") {
      result[index] = pickSkillsFromGrant(grant, lookup, exclude);
    }
  });

  return result;
}
