import type { Feat } from "@/shared/types";
import { formatModifier } from "@/shared/utils/cr.utils";

/**
 * Fixed HP per level by hit die (XPHB 2024 "Fixed Hit Points by Class" table).
 * Level 1 uses max hit die + Con; levels 2+ use these averages + Con (min 1 per level).
 */
const FIXED_HP_PER_LEVEL: Record<number, number> = {
  12: 7,
  10: 6,
  8: 5,
  4: 4,
};

export function parseHitDieFaces(hitDie: string): number | null {
  const match = hitDie.match(/^d(\d+)$/i);
  return match ? Number(match[1]) : null;
}

export function getFixedHpPerLevel(hitDieFaces: number): number {
  return FIXED_HP_PER_LEVEL[hitDieFaces] ?? Math.floor(hitDieFaces / 2) + 1;
}

export interface FeatHitPointBonus {
  label: string;
  amount: number;
  formula: string;
}

export interface CharacterHitPointBreakdown {
  max: number;
  hitDice: string;
  tooltip: string;
}

function getFeatText(feat: Feat): string {
  return [
    ...feat.paragraphs,
    ...feat.sections.flatMap((section) => section.paragraphs),
  ].join(" ");
}

/** Detect flat HP-max bonuses granted by a feat at the current level. */
export function detectFeatHitPointBonus(
  feat: Feat,
  level: number,
): FeatHitPointBonus | null {
  const normalizedName = feat.name.trim().toLowerCase();

  if (normalizedName === "tough") {
    const amount = 2 * level;
    return {
      label: feat.name,
      amount,
      formula: `2 × level ${level}`,
    };
  }

  const text = getFeatText(feat).toLowerCase();

  if (/twice your level|two times your level/.test(text)) {
    const amount = 2 * level;
    return {
      label: feat.name,
      amount,
      formula: `2 × level ${level}`,
    };
  }

  const perLevelMatch = text.match(
    /hit point maximum increases by (\d+) (?:for each|per) level/,
  );
  if (perLevelMatch) {
    const perLevel = Number(perLevelMatch[1]);
    return {
      label: feat.name,
      amount: perLevel * level,
      formula: `${perLevel} × level ${level}`,
    };
  }

  const plusLevelMatch = text.match(
    /hit point maximum increases by an amount equal to (\d+) \+ your level/,
  );
  if (plusLevelMatch) {
    const flat = Number(plusLevelMatch[1]);
    return {
      label: feat.name,
      amount: flat + level,
      formula: `${flat} + level ${level}`,
    };
  }

  const additionalPerLevel = text.match(/additional (\d+) hit points/);
  if (additionalPerLevel && /whenever you gain a level/.test(text)) {
    const perLevel = Number(additionalPerLevel[1]);
    return {
      label: feat.name,
      amount: perLevel * level,
      formula: `${perLevel} × level ${level}`,
    };
  }

  return null;
}

export function formatHitPointTooltip(parts: {
  level: number;
  conModifier: number;
  hitDie: string;
  hitDieFaces: number;
  className: string;
  firstLevel: number;
  laterLevelsTotal: number;
  classTotal: number;
  featBonuses: FeatHitPointBonus[];
  max: number;
}): string {
  const {
    level,
    conModifier,
    hitDie,
    hitDieFaces,
    className,
    firstLevel,
    laterLevelsTotal,
    classTotal,
    featBonuses,
    max,
  } = parts;

  const fixedPerLevel = getFixedHpPerLevel(hitDieFaces);
  const conLabel = formatModifier(conModifier);
  const lines: string[] = [
    `Level 1: ${hitDie} max + Con (${conLabel}) = ${firstLevel}`,
  ];

  if (level > 1) {
    lines.push(
      `Levels 2–${level}: ${level - 1} × (${fixedPerLevel} + Con) = ${laterLevelsTotal}`,
    );
  }

  lines.push(`Class (${className}): ${classTotal}`);
  lines.push("  Source: XPHB fixed HP table");

  for (const bonus of featBonuses) {
    lines.push(`Feat (${bonus.label}): +${bonus.amount}`);
    lines.push(`  ${bonus.formula}`);
  }

  lines.push(`Total: ${max}`);
  return lines.join("\n");
}

/**
 * Average/max-fixed HP for a single-class character (no rolled dice yet).
 */
export function getCharacterHitPointBreakdown(
  level: number,
  conModifier: number,
  hitDie: string,
  className: string,
  featBonuses: FeatHitPointBonus[] = [],
): CharacterHitPointBreakdown | null {
  const faces = parseHitDieFaces(hitDie);
  if (!faces || level < 1) return null;

  const fixedPerLevel = getFixedHpPerLevel(faces);
  const firstLevel = Math.max(1, faces + conModifier);
  const perLevelGain = Math.max(1, fixedPerLevel + conModifier);
  const laterLevelsTotal = (level - 1) * perLevelGain;
  const classTotal = firstLevel + laterLevelsTotal;
  const featTotal = featBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const max = classTotal + featTotal;

  return {
    max,
    hitDice: `${level}d${faces}`,
    tooltip: formatHitPointTooltip({
      level,
      conModifier,
      hitDie,
      hitDieFaces: faces,
      className,
      firstLevel,
      laterLevelsTotal,
      classTotal,
      featBonuses,
      max,
    }),
  };
}

/** @deprecated Use getCharacterHitPointBreakdown */
export function getCharacterHitPointStats(
  level: number,
  conModifier: number,
  hitDie: string,
): Pick<CharacterHitPointBreakdown, "max" | "hitDice"> | null {
  const breakdown = getCharacterHitPointBreakdown(
    level,
    conModifier,
    hitDie,
    "Class",
  );
  if (!breakdown) return null;
  return { max: breakdown.max, hitDice: breakdown.hitDice };
}
