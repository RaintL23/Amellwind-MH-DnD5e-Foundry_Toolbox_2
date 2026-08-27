import type { Class } from "@/shared/types";

/** PHB / XPHB Multiclass Spellcaster table (spell slots per combined caster level). */
export const MULTICLASS_SPELL_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

const FULL_CASTERS = new Set(["bard", "cleric", "druid", "sorcerer", "wizard"]);
const HALF_CASTERS = new Set(["paladin", "ranger"]);
const THIRD_CASTER_SUBCLASSES = new Set([
  "eldritch knight",
  "arcane trickster",
]);

export interface MulticlassCasterEntry {
  classData: Class | null;
  level: number;
  subclassName?: string | null;
}

export interface CasterContributionBreakdown {
  className: string;
  classLevel: number;
  contribution: number;
  note?: string;
}

function resolveCasterContribution(
  classData: Class,
  classLevel: number,
  subclassName: string | null,
): number {
  const name = classData.name.toLowerCase();
  const progression = classData.casterProgression;

  if (progression === "full" || FULL_CASTERS.has(name)) {
    return classLevel;
  }

  if (progression === "1/2" || HALF_CASTERS.has(name)) {
    return classData.edition === "one"
      ? Math.ceil(classLevel / 2)
      : Math.floor(classLevel / 2);
  }

  if (
    progression === "1/3" ||
    (subclassName && THIRD_CASTER_SUBCLASSES.has(subclassName.toLowerCase()))
  ) {
    return Math.floor(classLevel / 3);
  }

  if (progression === "pact") return 0;

  return 0;
}

export function getCasterContributionBreakdown(
  entries: MulticlassCasterEntry[],
): CasterContributionBreakdown[] {
  const breakdown: CasterContributionBreakdown[] = [];

  for (const entry of entries) {
    if (!entry.classData || entry.level < 1) continue;

    const subclassName = entry.subclassName ?? null;
    const contribution = resolveCasterContribution(
      entry.classData,
      entry.level,
      subclassName,
    );

    if (entry.classData.casterProgression === "pact") {
      breakdown.push({
        className: entry.classData.name,
        classLevel: entry.level,
        contribution: 0,
        note: "Pact Magic (tracked separately)",
      });
      continue;
    }

    if (contribution <= 0 && entry.classData.casterProgression === "none") {
      continue;
    }

    let note: string | undefined;
    const prog = entry.classData.casterProgression;
    if (prog === "1/2" || HALF_CASTERS.has(entry.classData.name.toLowerCase())) {
      note =
        entry.classData.edition === "one"
          ? "Half caster (ceil level ÷ 2)"
          : "Half caster (floor level ÷ 2)";
    } else if (
      prog === "1/3" ||
      (subclassName &&
        THIRD_CASTER_SUBCLASSES.has(subclassName.toLowerCase()) &&
        entry.level >= 3)
    ) {
      note = "Third caster (floor level ÷ 3)";
    } else if (prog === "full" || FULL_CASTERS.has(entry.classData.name.toLowerCase())) {
      note = "Full caster";
    }

    breakdown.push({
      className: entry.classData.name,
      classLevel: entry.level,
      contribution,
      note,
    });
  }

  return breakdown;
}

export function getMulticlassCasterLevel(
  entries: MulticlassCasterEntry[],
): number {
  let total = 0;
  let hasPact = false;

  for (const entry of entries) {
    if (!entry.classData || entry.level < 1) continue;
    const subclassName = entry.subclassName ?? null;

    if (entry.classData.casterProgression === "pact") {
      hasPact = true;
      continue;
    }

    total += resolveCasterContribution(
      entry.classData,
      entry.level,
      subclassName,
    );
  }

  if (total === 0 && !hasPact) return 0;
  return Math.min(20, Math.max(1, total));
}

export function getMulticlassSpellSlotLevels(casterLevel: number): number[] {
  if (casterLevel < 1) return [];
  const row = MULTICLASS_SPELL_SLOTS[casterLevel - 1];
  if (!row) return [];

  const levels: number[] = [];
  row.forEach((slots, index) => {
    if (slots > 0) levels.push(index + 1);
  });
  return levels;
}

export function getMulticlassSpellSlotCounts(
  casterLevel: number,
): Record<number, number> {
  if (casterLevel < 1) return {};
  const row = MULTICLASS_SPELL_SLOTS[casterLevel - 1];
  if (!row) return {};

  const counts: Record<number, number> = {};
  row.forEach((slots, index) => {
    if (slots > 0) counts[index + 1] = slots;
  });
  return counts;
}

export function hasMultipleSpellcastingClasses(
  entries: MulticlassCasterEntry[],
): boolean {
  let count = 0;
  for (const entry of entries) {
    if (!entry.classData || entry.level < 1) continue;
    const prog = entry.classData.casterProgression;
    if (prog && prog !== "none" && prog !== "pact") count++;
    if (prog === "pact") count++;
    const subclassName = entry.subclassName?.toLowerCase();
    if (
      subclassName &&
      THIRD_CASTER_SUBCLASSES.has(subclassName) &&
      entry.level >= 3
    ) {
      count++;
    }
  }
  return count > 1;
}

export function hasPactMagic(entries: MulticlassCasterEntry[]): boolean {
  return entries.some(
    (entry) =>
      entry.classData?.casterProgression === "pact" && entry.level >= 1,
  );
}
