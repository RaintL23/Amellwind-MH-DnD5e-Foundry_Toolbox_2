import type {
  AbilityKey,
  AbilityScores,
  ArmorClass,
  HP,
  Monster,
  Senses,
  SkillKey,
  Speed,
} from "@/shared/types";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { ABILITY_KEYS } from "@/shared/utils/ability-scores";
import { SKILL_LABELS, SKILL_NAME_TO_KEY } from "@/shared/constants/dnd";

/** Levels that grant an Ability Score Improvement (+2 points each). */
export const MONSTIE_ASI_LEVELS = [4, 8, 12, 14, 16, 19] as const;

/** Monstie ability scores can't exceed 20 through class features. */
export const MONSTIE_ABILITY_CAP = 20;

export function getSidekickProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function getMonstieSize(level: number): string {
  if (level >= 15) return "Large";
  if (level >= 6) return "Medium";
  return "Small";
}

export function getMonstieSpeed(base: Speed, level: number): Speed {
  const bonus = (level - 1) * 5;

  const apply = (
    original: number | undefined,
    start: number,
  ): number | undefined => {
    if (original === undefined) return undefined;
    return Math.min(original, start + bonus);
  };

  return {
    walk: apply(base.walk, 25) ?? 25,
    fly: apply(base.fly, 15),
    swim: apply(base.swim, 15),
    burrow: apply(base.burrow, 15),
    climb: apply(base.climb, 15),
    hover: base.hover,
  };
}

export function getMonstieSenses(base: Senses, level: number): Senses {
  const cap = level >= 15 ? 120 : level >= 6 ? 60 : 30;
  const limit = (val?: number) =>
    val === undefined ? undefined : Math.min(val, cap);

  return {
    darkvision: limit(base.darkvision),
    blindsight: limit(base.blindsight),
    tremorsense: limit(base.tremorsense),
    truesight: limit(base.truesight),
  };
}

export function getMonstieArmorClass(
  abilities: AbilityScores,
  level: number,
): ArmorClass[] {
  const pb = getSidekickProficiencyBonus(level);
  const dexMod = getAbilityModifier(abilities.dex);
  return [{ ac: 10 + dexMod + pb, from: ["natural armor"] }];
}

/** 10 + Con at 1st level, then 1d8 + Con per level; +15 at 15th and +1 per level after. */
export function getMonstieHitPoints(
  abilities: AbilityScores,
  level: number,
): HP {
  const conMod = getAbilityModifier(abilities.con);
  const extraDice = level - 1;
  const sizeBonus = level >= 15 ? 15 + (level - 15) : 0;
  const flat = 10 + level * conMod + sizeBonus;
  const average = Math.floor(extraDice * 4.5) + flat;

  const formula =
    extraDice > 0
      ? `${extraDice}d8 ${flat >= 0 ? "+" : "-"} ${Math.abs(flat)}`
      : undefined;
  return { average: Math.max(1, average), formula };
}

/** Maps a raw 5etools skill key ("perception", "animal handling") to a SkillKey. */
export function toSkillKey(raw: string): SkillKey | null {
  const lower = raw.trim().toLowerCase();
  if (lower in SKILL_LABELS) return lower as SkillKey;
  if (SKILL_NAME_TO_KEY[lower]) return SKILL_NAME_TO_KEY[lower];
  // MHMM typo seen in data ("acrobat").
  const prefix = Object.keys(SKILL_NAME_TO_KEY).find((name) =>
    name.startsWith(lower),
  );
  return prefix ? SKILL_NAME_TO_KEY[prefix] : null;
}

/** Skill keys the original monster is proficient in, deduplicated. */
export function getBaseSkillKeys(monster: Monster): SkillKey[] {
  const keys: SkillKey[] = [];
  for (const raw of Object.keys(monster.skills ?? {})) {
    const key = toSkillKey(raw);
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

export function getMaxSkillSlots(level: number, totalBaseSkills: number): number {
  const slotsByLevel: Array<[number, number]> = [
    [1, 2],
    [4, 3],
    [8, 4],
    [12, 5],
    [14, 6],
    [16, 7],
    [19, 8],
  ];
  let slots = 0;
  for (const [lvl, count] of slotsByLevel) {
    if (level >= lvl) slots = count;
  }
  return Math.min(slots, totalBaseSkills);
}

export function getTraitPickSlots(level: number): number {
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  if (level >= 2) return 1;
  return 0;
}

export function getCreatureFeatureSlots(level: number): number {
  if (level >= 18) return 3;
  if (level >= 11) return 2;
  if (level >= 3) return 1;
  return 0;
}

export function getSaveDc(
  abilities: AbilityScores,
  ability: AbilityKey,
  level: number,
): number {
  return (
    8 + getSidekickProficiencyBonus(level) + getAbilityModifier(abilities[ability])
  );
}

export function hasMonstieSavingThrows(level: number): boolean {
  return level >= 7;
}

export interface MonstieAbilityBudgetInput {
  level: number;
  /** Trait options the original monster offers for Monstie Trait. */
  traitOptionCount: number;
  /** Whether the original monster lists saving throw proficiencies. */
  baseHasSaves: boolean;
  /** Condition picked instead of +2 ability points at 7th level (no-save monsters). */
  saveFallbackCondition: string;
}

/**
 * Ability points available from class features:
 * ASI (+2 each), Monstie Trait with no trait left to learn (+1 each),
 * and Saving Throws at 7th when the original has none and no immunity was chosen (+2).
 */
export function getMonstieAbilityPointBudget(input: MonstieAbilityBudgetInput): number {
  const asiPoints =
    MONSTIE_ASI_LEVELS.filter((lvl) => input.level >= lvl).length * 2;
  const traitSlots = getTraitPickSlots(input.level);
  const traitShortfall = Math.max(0, traitSlots - input.traitOptionCount);
  const savePoints =
    hasMonstieSavingThrows(input.level) &&
    !input.baseHasSaves &&
    !input.saveFallbackCondition
      ? 2
      : 0;
  return asiPoints + traitShortfall + savePoints;
}

/** Keeps increases within the point budget and the 20 cap (drops from the end). */
export function clampAbilityIncreases(
  increases: Partial<Record<AbilityKey, number>>,
  baseAbilities: AbilityScores,
  budget: number,
): Partial<Record<AbilityKey, number>> {
  const result: Partial<Record<AbilityKey, number>> = {};
  let remaining = Math.max(0, budget);
  for (const key of ABILITY_KEYS) {
    const wanted = Math.max(0, Math.floor(increases[key] ?? 0));
    const room = Math.max(0, MONSTIE_ABILITY_CAP - baseAbilities[key]);
    const applied = Math.min(wanted, room, remaining);
    if (applied > 0) {
      result[key] = applied;
      remaining -= applied;
    }
  }
  return result;
}

export function applyAbilityIncreases(
  baseAbilities: AbilityScores,
  increases: Partial<Record<AbilityKey, number>>,
): AbilityScores {
  const result = { ...baseAbilities };
  for (const key of ABILITY_KEYS) {
    result[key] = Math.min(
      MONSTIE_ABILITY_CAP,
      baseAbilities[key] + (increases[key] ?? 0),
    );
  }
  return result;
}

export function sumAbilityIncreases(
  increases: Partial<Record<AbilityKey, number>>,
): number {
  return Object.values(increases).reduce((sum, v) => sum + (v ?? 0), 0);
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};

function parseCount(word: string): number {
  const lower = word.toLowerCase();
  return NUMBER_WORDS[lower] ?? (Number(lower) || 0);
}

/**
 * Number of attacks in the original monster's Multiattack (0 when it has none).
 * Handles "makes three attacks: one with…" and "makes one Bite attack and one
 * Talons attack; or …" (first option only).
 */
export function getMultiattackCount(monster: Monster): number {
  const multi = monster.actions.find((a) => /multiattack/i.test(a.name));
  if (!multi) return 0;
  const text = multi.entries.join(" ");
  const total = text.match(
    /\bmakes?\s+(one|two|three|four|five|six|\d+)\s+(?:\w+\s+)?attacks\b/i,
  );
  if (total) return parseCount(total[1]);

  const firstOption = text.split(/;|\.\s|\bor\b/i)[0];
  const counts = [
    ...firstOption.matchAll(/\b(one|two|three|four|five|six|\d+)\s+[\w' -]*?\battacks?\b/gi),
  ].map((m) => parseCount(m[1]));
  const sum = counts.reduce((a, b) => a + b, 0);
  return sum > 0 ? sum : 2;
}

export interface MonstieExtraAttackResult {
  /** Attacks per Attack action (1–3). */
  attacks: number;
  /** Extra damage dice on melee/ranged attacks when no extra attack is granted. */
  extraDice: number;
}

/**
 * Extra Attack or Damage (6th / 15th): the monstie gains an attack only while it
 * stays within the original Multiattack; otherwise its attacks gain one die instead.
 */
export function resolveExtraAttack(
  level: number,
  multiattackCount: number,
): MonstieExtraAttackResult {
  let attacks = 1;
  let extraDice = 0;
  for (const tierLevel of [6, 15]) {
    if (level < tierLevel) continue;
    if (multiattackCount >= attacks + 1) attacks += 1;
    else extraDice += 1;
  }
  return { attacks, extraDice };
}
