import type { AbilityKey, AbilityScores, Class, Species } from "@/shared/types";
import {
  detectUnarmedStrikeFromSpecies,
  type SpeciesUnarmedStrikeRule,
  unarmedStrikeRuleAverage,
} from "./species-unarmed-strike";

/** PHB 2014 Monk — fallback when class table is unavailable. */
const MONK_MARTIAL_ARTS_DIE_PHB: Record<number, number> = {
  1: 4, 2: 4, 3: 4, 4: 4,
  5: 6, 6: 6, 7: 6, 8: 6, 9: 6, 10: 6,
  11: 8, 12: 8, 13: 8, 14: 8, 15: 8, 16: 8,
  17: 10, 18: 10, 19: 10, 20: 10,
};

/** XPHB 2024 Monk — fallback when class table is unavailable. */
const MONK_MARTIAL_ARTS_DIE_XPHB: Record<number, number> = {
  1: 6, 2: 6, 3: 6, 4: 6,
  5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8,
  11: 10, 12: 10, 13: 10, 14: 10, 15: 10, 16: 10,
  17: 12, 18: 12, 19: 12, 20: 12,
};

export interface UnarmedStrikeProfile {
  abilityUsed: AbilityKey;
  flatBase: number;
  diceCount: number;
  diceSides: number;
  label: string;
}

interface UnarmedStrikeCandidate {
  profile: UnarmedStrikeProfile;
  average: number;
}

export function isMonkClass(className?: string | null): boolean {
  return className?.trim().toLowerCase() === "monk";
}

/** Parses die sides from mapped class table notation (e.g. "1d6" → 6). */
export function parseMartialArtsDieNotation(notation: string): number | null {
  const match = notation.match(/(\d+)d(\d+)/i);
  if (!match) return null;
  return parseInt(match[2], 10);
}

/**
 * Reads the Martial Arts die from the mapped class table (classTableGroups).
 * Uses the "Martial Arts" column at the character's level.
 */
export function getMartialArtsDieFromClass(
  classData: Class | null | undefined,
  level: number,
): number | null {
  if (!classData || !isMonkClass(classData.name)) return null;

  const clampedLevel = Math.max(1, Math.min(20, level));
  const row = classData.progression[clampedLevel - 1];
  if (!row?.tableCells?.length) return null;

  let colOffset = 0;
  for (const group of classData.spellProgression) {
    const martialArtsCol = group.colLabels.findIndex((label) =>
      /martial arts/i.test(label),
    );
    if (martialArtsCol >= 0) {
      const cell = row.tableCells[colOffset + martialArtsCol];
      if (cell) return parseMartialArtsDieNotation(cell);
    }
    colOffset += group.colLabels.length;
  }

  return parseMartialArtsDieNotation(row.tableCells[0] ?? "");
}

function getMonkMartialArtsDieFallback(
  level: number,
  source?: string | null,
): number {
  const clamped = Math.max(1, Math.min(20, level));
  const table =
    source?.toUpperCase() === "XPHB"
      ? MONK_MARTIAL_ARTS_DIE_XPHB
      : MONK_MARTIAL_ARTS_DIE_PHB;
  return table[clamped] ?? (source?.toUpperCase() === "XPHB" ? 6 : 4);
}

function getBaseProfile(): UnarmedStrikeProfile {
  return {
    abilityUsed: "str",
    flatBase: 1,
    diceCount: 0,
    diceSides: 0,
    label: "Unarmed Strike",
  };
}

function getMonkProfile(
  level: number,
  classData?: Class | null,
): UnarmedStrikeProfile | null {
  const die =
    getMartialArtsDieFromClass(classData, level) ??
    getMonkMartialArtsDieFallback(level, classData?.source);

  return {
    abilityUsed: "dex",
    flatBase: 0,
    diceCount: 1,
    diceSides: die,
    label: `Unarmed Strike (Martial Arts d${die})`,
  };
}

function getSpeciesProfile(rule: SpeciesUnarmedStrikeRule): UnarmedStrikeProfile {
  return {
    abilityUsed: rule.abilityUsed,
    flatBase: rule.flatBase,
    diceCount: rule.diceCount,
    diceSides: rule.diceSides,
    label: `Unarmed Strike (${rule.featureName})`,
  };
}

function profileAverage(
  profile: UnarmedStrikeProfile,
  abilities: AbilityScores,
): number {
  const dieAvg =
    profile.diceSides > 0
      ? profile.diceCount * ((profile.diceSides + 1) / 2)
      : 0;
  const mod = Math.floor((abilities[profile.abilityUsed] - 10) / 2);
  return dieAvg + profile.flatBase + mod;
}

function pickBestCandidate(
  candidates: UnarmedStrikeCandidate[],
): UnarmedStrikeProfile {
  if (!candidates.length) return getBaseProfile();

  return candidates.reduce((best, current) =>
    current.average > best.average ? current : best,
  ).profile;
}

/**
 * Resolves unarmed strike damage from base rule, species traits, and class features.
 * Picks the option with the highest average damage at the character's ability scores.
 */
export function getUnarmedStrikeProfile(
  level: number,
  abilities: AbilityScores,
  className?: string | null,
  classData?: Class | null,
  speciesData?: Species | null,
): UnarmedStrikeProfile {
  const candidates: UnarmedStrikeCandidate[] = [];

  const base = getBaseProfile();
  candidates.push({
    profile: base,
    average: profileAverage(base, abilities),
  });

  const speciesRule = detectUnarmedStrikeFromSpecies(speciesData);
  if (speciesRule) {
    const profile = getSpeciesProfile(speciesRule);
    candidates.push({
      profile,
      average: unarmedStrikeRuleAverage(speciesRule, abilities),
    });
  }

  if (isMonkClass(className)) {
    const monkProfile = getMonkProfile(level, classData);
    if (monkProfile) {
      candidates.push({
        profile: monkProfile,
        average: profileAverage(monkProfile, abilities),
      });
    }
  }

  return pickBestCandidate(candidates);
}

/** @deprecated Use profile.diceSides > 0 — kept for callers checking martial arts die. */
export function getMartialArtsDieSides(profile: UnarmedStrikeProfile): number | null {
  return profile.diceSides > 0 ? profile.diceSides : null;
}
