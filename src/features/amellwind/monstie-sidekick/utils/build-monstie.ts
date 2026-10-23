import type {
  AbilityKey,
  AbilityScores,
  Entry,
  Monster,
  MonstieDraft,
  MonstieSidekick,
  MonstieClassFeature,
  SkillKey,
} from "@/shared/types";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { SKILL_ABILITY } from "@/shared/constants/dnd";
import { mapAbilitiesFromOriginal } from "./monstie-abilities";
import {
  applyAbilityIncreases,
  clampAbilityIncreases,
  getBaseSkillKeys,
  getCreatureFeatureSlots,
  getMaxSkillSlots,
  getMonstieAbilityPointBudget,
  getMonstieArmorClass,
  getMonstieHitPoints,
  getMonstieSenses,
  getMonstieSize,
  getMonstieSpeed,
  getMultiattackCount,
  getSidekickProficiencyBonus,
  getTraitPickSlots,
  hasMonstieSavingThrows,
  resolveExtraAttack,
  type MonstieExtraAttackResult,
} from "./monstie-stats";
import {
  getBaseAttackOptions,
  getCreatureFeatureOptions,
  getSignatureAttackOptions,
  getTraitOptions,
} from "./monstie-actions";
import {
  buildMonstieBaseAttack,
  buildMonstieCreatureFeature,
  buildMonstieSignatureAttack,
  buildMonstieTrait,
  type MonstieScalingContext,
} from "./monstie-scaling";

/** Everything the creator UI and the stat block builder derive from a draft. */
export interface MonstieChoices {
  level: number;
  proficiencyBonus: number;
  baseAbilities: AbilityScores;
  abilityBudget: number;
  abilityIncreases: Partial<Record<AbilityKey, number>>;
  abilities: AbilityScores;
  skillOptions: SkillKey[];
  maxSkillSlots: number;
  selectedSkills: SkillKey[];
  baseAttackOptions: Entry[];
  signatureOptions: Entry[];
  traitOptions: Entry[];
  maxTraitSlots: number;
  selectedTraits: string[];
  creatureOptions: Entry[];
  maxCreatureSlots: number;
  selectedCreatureFeatures: string[];
  baseHasSaves: boolean;
  conditionImmunityOptions: string[];
  extraAttack: MonstieExtraAttackResult;
}

export function resolveMonstieChoices(
  draft: MonstieDraft,
  base: Monster,
): MonstieChoices {
  const level = Math.min(20, Math.max(1, draft.level));
  const baseAbilities = mapAbilitiesFromOriginal(base.abilities);
  const traitOptions = getTraitOptions(base);
  const baseHasSaves = Object.keys(base.savingThrows ?? {}).length > 0;
  const conditionImmunityOptions = base.conditionImmunities.map((c) =>
    parseFiveToolsMarkup(String(c)),
  );
  const saveFallbackCondition = conditionImmunityOptions.includes(
    draft.saveFallbackCondition,
  )
    ? draft.saveFallbackCondition
    : "";

  const abilityBudget = getMonstieAbilityPointBudget({
    level,
    traitOptionCount: traitOptions.length,
    baseHasSaves,
    saveFallbackCondition,
  });
  const abilityIncreases = clampAbilityIncreases(
    draft.abilityIncreases,
    baseAbilities,
    abilityBudget,
  );

  const skillOptions = getBaseSkillKeys(base);
  const maxSkillSlots = getMaxSkillSlots(level, skillOptions.length);

  const traitNames = new Set(traitOptions.map((t) => t.name));
  const maxTraitSlots = Math.min(getTraitPickSlots(level), traitOptions.length);
  const selectedTraits = draft.selectedTraits
    .filter((name) => traitNames.has(name))
    .slice(0, maxTraitSlots);

  const creatureOptions = getCreatureFeatureOptions(base, [
    draft.baseAttackName,
    draft.signatureAttackName,
    ...selectedTraits,
  ]);
  const creatureNames = new Set(creatureOptions.map((c) => c.name));
  const maxCreatureSlots = getCreatureFeatureSlots(level);

  return {
    level,
    proficiencyBonus: getSidekickProficiencyBonus(level),
    baseAbilities,
    abilityBudget,
    abilityIncreases,
    abilities: applyAbilityIncreases(baseAbilities, abilityIncreases),
    skillOptions,
    maxSkillSlots,
    selectedSkills: draft.selectedSkills
      .filter((key) => skillOptions.includes(key))
      .slice(0, maxSkillSlots),
    baseAttackOptions: getBaseAttackOptions(base),
    signatureOptions: getSignatureAttackOptions(base),
    traitOptions,
    maxTraitSlots,
    selectedTraits,
    creatureOptions,
    maxCreatureSlots,
    selectedCreatureFeatures: draft.selectedCreatureFeatures
      .filter((name) => creatureNames.has(name))
      .slice(0, maxCreatureSlots),
    baseHasSaves,
    conditionImmunityOptions,
    extraAttack: resolveExtraAttack(level, getMultiattackCount(base)),
  };
}

function buildSavingThrows(
  base: Monster,
  abilities: AbilityScores,
  pb: number,
): Partial<Record<AbilityKey, string>> {
  const saves: Partial<Record<AbilityKey, string>> = {};
  for (const key of Object.keys(base.savingThrows ?? {}) as AbilityKey[]) {
    if (!(key in abilities)) continue;
    saves[key] = formatModifier(getAbilityModifier(abilities[key]) + pb);
  }
  return saves;
}

export function buildMonstieFromDraft(
  draft: MonstieDraft,
  base: Monster,
  classFeatures: MonstieClassFeature[],
): MonstieSidekick {
  const choices = resolveMonstieChoices(draft, base);
  const { level, abilities, proficiencyBonus: pb } = choices;
  const ctx: MonstieScalingContext = {
    level,
    pb,
    abilities,
    extraDice: choices.extraAttack.extraDice,
  };

  const skills: Record<string, number> = {};
  for (const key of choices.selectedSkills) {
    const abilityKey = SKILL_ABILITY[key] ?? "wis";
    skills[key] = getAbilityModifier(abilities[abilityKey]) + pb;
  }

  const baseAttack = choices.baseAttackOptions.find(
    (a) => a.name === draft.baseAttackName,
  );
  const signature = choices.signatureOptions.find(
    (a) => a.name === draft.signatureAttackName,
  );

  const traits: Entry[] = base.traits
    .filter((t) => choices.selectedTraits.includes(t.name))
    .map((t) => buildMonstieTrait(t, ctx));
  const actions: Entry[] = [];
  const bonusActions: Entry[] = [];

  const baseTraitNames = new Set(base.traits.map((t) => t.name));
  const bonusActionNames = new Set((base.bonusActions ?? []).map((a) => a.name));
  for (const option of choices.creatureOptions) {
    if (!choices.selectedCreatureFeatures.includes(option.name)) continue;
    if (baseTraitNames.has(option.name)) {
      traits.push(buildMonstieCreatureFeature(option, "trait", ctx));
    } else if (bonusActionNames.has(option.name)) {
      bonusActions.push(buildMonstieCreatureFeature(option, "action", ctx));
    } else {
      actions.push(buildMonstieCreatureFeature(option, "action", ctx));
    }
  }

  const subject = (base.shortName ?? base.name).toLowerCase();
  const { attacks, extraDice } = choices.extraAttack;
  const extraAttackEntry: Entry[] =
    attacks > 1
      ? [
          {
            name: "Extra Attack",
            entries: [
              `The ${subject} can attack ${attacks === 2 ? "twice" : "three times"}, instead of once, whenever it takes the Attack action on its turn.`,
            ],
          },
        ]
      : [];
  if (extraDice > 0) {
    traits.push({
      name: "Extra Damage",
      entries: [
        `The ${subject}'s melee and ranged attacks deal ${extraDice === 1 ? "one extra die" : `${extraDice} extra dice`} of damage (included below).`,
      ],
    });
  }

  const passivePerception =
    10 +
    getAbilityModifier(abilities.wis) +
    (choices.selectedSkills.includes("prc") ? pb : 0);

  const conditionImmunities =
    hasMonstieSavingThrows(level) &&
    !choices.baseHasSaves &&
    choices.conditionImmunityOptions.includes(draft.saveFallbackCondition)
      ? [draft.saveFallbackCondition]
      : [];

  const nonCommonLanguages = base.languages.filter((l) => !/common/i.test(l));

  return {
    name:
      draft.customName.trim() ||
      `${base.shortName ?? base.name} Monstie (Lvl ${level})`,
    shortName: base.shortName,
    size: getMonstieSize(level),
    type: base.type,
    alignment: ["U"],
    armorClass: getMonstieArmorClass(abilities, level),
    hp: getMonstieHitPoints(abilities, level),
    speed: getMonstieSpeed(base.speed, level),
    initiative: getAbilityModifier(abilities.dex),
    proficiencyBonus: pb,
    abilities,
    savingThrows: hasMonstieSavingThrows(level)
      ? buildSavingThrows(base, abilities, pb)
      : {},
    skills: skills as MonstieSidekick["skills"],
    passivePerception,
    senses: getMonstieSenses(base.senses, level),
    damageImmunities: [],
    damageResistances: [],
    damageVulnerabilities: [],
    conditionImmunities,
    languages: [
      ...nonCommonLanguages,
      "understands Common but can't speak it",
    ],
    traits,
    actions: [
      ...extraAttackEntry,
      ...(baseAttack ? [buildMonstieBaseAttack(baseAttack, ctx)] : []),
      ...(signature ? [buildMonstieSignatureAttack(signature, ctx)] : []),
      ...actions,
    ],
    bonusActions: bonusActions.length > 0 ? bonusActions : undefined,
    reactions: [],
    source: base.source,
    cr: `Sidekick ${level}`,
    level,
    baseMonsterName: base.name,
    classFeatures: classFeatures.filter((f) => f.level <= level),
  };
}
