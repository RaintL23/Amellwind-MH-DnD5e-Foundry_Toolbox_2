import type { SkillKey } from "@/shared/types";
import type {
  ExpertiseGrant,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import { resolveFixedGrants } from "@/features/builder/utils/compute-character-proficiencies";
import { skillsFromHigherPriority } from "@/features/builder/utils/skill-choice-hierarchy.utils";
import { pickMultipleByRpgbot, shuffle } from "./character-randomizer.utils";

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
  /** Skills from higher-priority sources — do not count toward this picker's quota. */
  alreadyGranted: Set<SkillKey> = new Set(),
): SkillKey[] {
  if (grant.kind === "fixed") return [];

  const isAvailable = (skill: SkillKey) =>
    !exclude.has(skill) && !alreadyGranted.has(skill);

  const pool =
    grant.kind === "choose"
      ? grant.from.filter(isAvailable)
      : ALL_SKILL_KEYS.filter(isAvailable);

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
  initialExclude: Set<SkillKey> = new Set(),
  alreadyGranted: Set<SkillKey> = new Set(),
): Record<number, SkillKey[]> {
  const exclude = new Set(initialExclude);
  const result: Record<number, SkillKey[]> = {};
  let grantIndex = 0;

  for (const grant of grants) {
    if (grant.kind !== "choose" && grant.kind !== "any") continue;

    const picked = pickSkillsFromGrant(grant, lookup, exclude, alreadyGranted);
    result[grantIndex] = picked;
    grantIndex += 1;
  }

  return result;
}

/** Skills already proficient from species, background, and class (higher priority than feats). */
export function alreadyGrantedSkillsForFeatPicker(
  speciesGrants: SkillProficiencyGrant[],
  speciesChoices: SkillKey[],
  backgroundGrants: SkillProficiencyGrant[],
  backgroundChoices: SkillKey[],
  classGrants: SkillProficiencyGrant[],
  classChoices: SkillKey[],
): Set<SkillKey> {
  const covered = skillsFromHigherPriority(
    "feat",
    speciesGrants,
    speciesChoices,
    backgroundGrants,
    backgroundChoices,
    classGrants,
    classChoices,
  );
  return new Set(Object.keys(covered) as SkillKey[]);
}

export function pickPendingSkillGrants(
  grants: Array<Extract<SkillProficiencyGrant, { kind: "choose" | "any" }>>,
  lookup: RpgbotLookupFn | null,
  initialExclude: Set<SkillKey> = new Set(),
): SkillKey[] {
  const exclude = new Set(initialExclude);
  const choices: SkillKey[] = [];

  for (const grant of grants) {
    choices.push(...pickSkillsFromGrant(grant, lookup, exclude));
  }

  return choices;
}

export function collectProficientSkillsFromChoices(input: {
  speciesGrants: SkillProficiencyGrant[];
  speciesChoices: SkillKey[];
  backgroundGrants: SkillProficiencyGrant[];
  backgroundChoices: SkillKey[];
  classGrants: SkillProficiencyGrant[];
  classChoices: Record<number, SkillKey[]>;
  originFeatChoices: SkillKey[];
  featChoices: Record<number, SkillKey[]>;
}): SkillKey[] {
  const skills = new Set<SkillKey>();

  for (const { skill } of resolveFixedGrants(input.speciesGrants)) {
    skills.add(skill);
  }
  for (const skill of input.speciesChoices) skills.add(skill);

  for (const { skill } of resolveFixedGrants(input.backgroundGrants)) {
    skills.add(skill);
  }
  for (const skill of input.backgroundChoices) skills.add(skill);

  for (const { skill } of resolveFixedGrants(input.classGrants)) {
    skills.add(skill);
  }
  for (const choices of Object.values(input.classChoices)) {
    for (const skill of choices) skills.add(skill);
  }

  for (const skill of input.originFeatChoices) skills.add(skill);
  for (const choices of Object.values(input.featChoices)) {
    for (const skill of choices) skills.add(skill);
  }

  return [...skills];
}

export function pickExpertiseChoicesForGrants(
  grants: ExpertiseGrant[],
  proficientSkills: SkillKey[],
): Record<string, SkillKey[]> {
  const pending = grants.filter(
    (grant): grant is Extract<ExpertiseGrant, { kind: "chooseProficient" }> =>
      grant.kind === "chooseProficient",
  );
  const used = new Set<SkillKey>();
  const result: Record<string, SkillKey[]> = {};

  pending.forEach((grant, index) => {
    const grantId = `${grant.source.name}-${index}`;
    const pool = proficientSkills.filter((skill) => {
      if (used.has(skill)) return false;
      if (grant.from?.length && !grant.from.includes(skill)) return false;
      return true;
    });
    const picked = shuffle(pool).slice(0, Math.min(grant.count, pool.length));
    for (const skill of picked) used.add(skill);
    result[grantId] = picked;
  });

  return result;
}
