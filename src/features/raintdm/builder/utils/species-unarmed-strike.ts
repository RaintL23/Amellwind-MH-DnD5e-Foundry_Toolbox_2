import type { AbilityKey, AbilityScores, Species, SpeciesTrait } from "@/shared/types";

export interface SpeciesUnarmedStrikeRule {
  featureName: string;
  sourceName: string;
  diceCount: number;
  diceSides: number;
  abilityUsed: AbilityKey;
  flatBase: number;
}

function parseAbilityFromText(text: string): AbilityKey {
  const lower = text.toLowerCase();
  const mentionsStr = /strength modifier/.test(lower);
  const mentionsDex = /dexterity modifier/.test(lower);

  if (mentionsDex && !mentionsStr) return "dex";
  if (mentionsStr) return "str";
  return "str";
}

function parseDiceFromText(text: string): { count: number; sides: number } | null {
  const patterns = [
    /\{@damage (\d+)d(\d+)\}/i,
    /\{@dice (\d+)d(\d+)\}/i,
    /(\d+)d(\d+)\s*\+\s*your (?:strength|dexterity) modifier/i,
    /equal to (\d+)d(\d+)/i,
    /deals?\s+(\d+)d(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        count: parseInt(match[1], 10),
        sides: parseInt(match[2], 10),
      };
    }
  }

  return null;
}

function traitAffectsUnarmedStrike(text: string): boolean {
  const lower = text.toLowerCase();
  const mentionsUnarmed =
    /unarmed strikes?/.test(lower) ||
    /{@variantrule unarmed strike/i.test(text);

  if (!mentionsUnarmed) return false;

  return (
    /natural weapons?/.test(lower) ||
    /natural melee weapons?/.test(lower) ||
    /make unarmed strikes?/.test(lower) ||
    /\d+d\d+/.test(lower) ||
    /{@damage/i.test(text) ||
    /{@dice/i.test(text)
  );
}

function parseUnarmedStrikeFromText(
  text: string,
  featureName: string,
  sourceName: string,
): SpeciesUnarmedStrikeRule | null {
  if (!traitAffectsUnarmedStrike(text)) return null;

  const dice = parseDiceFromText(text);
  if (!dice) return null;

  return {
    featureName,
    sourceName,
    diceCount: dice.count,
    diceSides: dice.sides,
    abilityUsed: parseAbilityFromText(text),
    flatBase: 0,
  };
}

export function detectUnarmedStrikeFromTraits(
  traits: SpeciesTrait[],
  sourceName: string,
): SpeciesUnarmedStrikeRule | null {
  for (const trait of traits) {
    const text = trait.entries.join(" ");
    const parsed = parseUnarmedStrikeFromText(text, trait.name, sourceName);
    if (parsed) return parsed;
  }
  return null;
}

export function detectUnarmedStrikeFromSpecies(
  species: Species | null | undefined,
): SpeciesUnarmedStrikeRule | null {
  if (!species?.traits?.length) return null;
  return detectUnarmedStrikeFromTraits(species.traits, species.name);
}

export function unarmedStrikeRuleAverage(
  rule: Pick<
    SpeciesUnarmedStrikeRule,
    "diceCount" | "diceSides" | "flatBase" | "abilityUsed"
  >,
  abilities: AbilityScores,
): number {
  const dieAvg =
    rule.diceSides > 0
      ? rule.diceCount * ((rule.diceSides + 1) / 2)
      : 0;
  const mod = Math.floor((abilities[rule.abilityUsed] - 10) / 2);
  return dieAvg + rule.flatBase + mod;
}
