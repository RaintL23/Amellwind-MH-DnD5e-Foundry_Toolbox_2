import type {
  AbilityKey,
  AbilityScores,
  BuilderMulticlassEntry,
  BuilderMulticlassClassSlot,
  BuilderMulticlassSubclassSlot,
  Class,
  CharacterSelectionRef,
} from "@/shared/types";
import {
  getFixedHpPerLevel,
  parseHitDieFaces,
  type FeatHitPointBonus,
} from "./character-hit-points";
import { formatModifier } from "@/shared/utils/cr.utils";
import { ABILITY_NAMES } from "@/shared/constants/dnd";

const STANDARD_ASI_LEVELS = [4, 8, 12, 16, 19] as const;
const FIGHTER_BONUS_ASI_CLASS_LEVELS = [6, 14] as const;

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

const ABILITY_LABELS: Record<AbilityKey, string> = ABILITY_NAMES;

export interface BuilderClassLevelEntry {
  classRef: CharacterSelectionRef | null;
  classData: Class | null;
  level: number;
  subclass: CharacterSelectionRef | null;
  isPrimary: boolean;
}

export function isMulticlassClassSlot(
  slot: string | null,
): slot is BuilderMulticlassClassSlot {
  return typeof slot === "string" && /^multiclass-class-\d+$/.test(slot);
}

export function isMulticlassSubclassSlot(
  slot: string | null,
): slot is BuilderMulticlassSubclassSlot {
  return typeof slot === "string" && /^multiclass-subclass-\d+$/.test(slot);
}

export function parseMulticlassClassSlotIndex(
  slot: BuilderMulticlassClassSlot,
): number {
  return Number(slot.replace("multiclass-class-", ""));
}

export function parseMulticlassSubclassSlotIndex(
  slot: BuilderMulticlassSubclassSlot,
): number {
  return Number(slot.replace("multiclass-subclass-", ""));
}

export function toMulticlassClassSlot(
  index: number,
): BuilderMulticlassClassSlot {
  return `multiclass-class-${index}`;
}

export function toMulticlassSubclassSlot(
  index: number,
): BuilderMulticlassSubclassSlot {
  return `multiclass-subclass-${index}`;
}

export function getPrimaryClassLevel(
  totalLevel: number,
  multiclassEntries: BuilderMulticlassEntry[],
): number {
  const additional = multiclassEntries.reduce((sum, e) => sum + e.level, 0);
  return Math.max(1, totalLevel - additional);
}

export function getTotalClassLevels(
  primaryLevel: number,
  multiclassEntries: BuilderMulticlassEntry[],
): number {
  return primaryLevel + multiclassEntries.reduce((sum, e) => sum + e.level, 0);
}

export function buildClassLevelEntries(
  primaryClassRef: CharacterSelectionRef | null,
  primaryClassData: Class | null,
  primaryLevel: number,
  primarySubclass: CharacterSelectionRef | null,
  multiclassEntries: BuilderMulticlassEntry[],
  multiclassClassData: (Class | null)[],
): BuilderClassLevelEntry[] {
  const entries: BuilderClassLevelEntry[] = [
    {
      classRef: primaryClassRef,
      classData: primaryClassData,
      level: primaryLevel,
      subclass: primarySubclass,
      isPrimary: true,
    },
  ];

  multiclassEntries.forEach((entry, index) => {
    entries.push({
      classRef: entry.classRef,
      classData: multiclassClassData[index] ?? null,
      level: entry.level,
      subclass: entry.subclass,
      isPrimary: false,
    });
  });

  return entries;
}

/** Level order: primary class levels first, then each multiclass entry in order. */
export function buildLevelOrder(
  classEntries: BuilderClassLevelEntry[],
): number[] {
  const order: number[] = [];
  for (let i = 0; i < classEntries.length; i++) {
    for (let l = 0; l < classEntries[i].level; l++) {
      order.push(i);
    }
  }
  return order;
}

export function getMulticlassPrerequisiteFailures(
  classEntries: BuilderClassLevelEntry[],
  abilityScores: AbilityScores,
): string[] {
  return collectPrerequisiteFailures(classEntries, abilityScores).map(
    formatPrerequisiteFailureLine,
  );
}

export interface PrerequisiteFailure {
  className: string;
  ability: AbilityKey;
  abilityLabel: string;
  current: number;
  minimum: number;
}

export function collectPrerequisiteFailures(
  classEntries: BuilderClassLevelEntry[],
  abilityScores: AbilityScores,
): PrerequisiteFailure[] {
  const failures: PrerequisiteFailure[] = [];
  const active = classEntries.filter((e) => e.classRef && e.classData);

  for (const entry of active) {
    const reqs = entry.classData!.multiclassRequirements;
    if (!reqs) continue;

    for (const [ability, minimum] of Object.entries(reqs) as [
      AbilityKey,
      number,
    ][]) {
      const current = abilityScores[ability];
      if (current < minimum) {
        failures.push({
          className: entry.classData!.name,
          ability,
          abilityLabel: ABILITY_LABELS[ability],
          current,
          minimum,
        });
      }
    }
  }

  return failures;
}

function formatPrerequisiteFailureLine(failure: PrerequisiteFailure): string {
  return `${failure.className}: ${failure.abilityLabel} ${failure.current} (min. ${failure.minimum})`;
}

/** User-facing summary for library disabled rows. */
export function formatPrerequisiteFailureReason(
  failures: PrerequisiteFailure[],
): string {
  if (!failures.length) return "";
  const parts = failures.map(
    (f) => `${f.abilityLabel} ${f.minimum} (you have ${f.current})`,
  );
  return `Prerequisites not met: ${parts.join(", ")}`;
}

export function getMulticlassCandidatePrerequisiteFailures(
  candidateClass: Class,
  currentEntries: BuilderClassLevelEntry[],
  abilityScores: AbilityScores,
): PrerequisiteFailure[] {
  const hypothetical: BuilderClassLevelEntry[] = [
    ...currentEntries,
    {
      classRef: { id: candidateClass.id, name: candidateClass.name },
      classData: candidateClass,
      level: 1,
      subclass: null,
      isPrimary: false,
    },
  ];
  return collectPrerequisiteFailures(hypothetical, abilityScores);
}

export function buildCurrentClassesForMulticlassPicker(
  primaryClassRef: CharacterSelectionRef | null,
  primaryClassData: Class | null,
  primaryLevel: number,
  primarySubclass: CharacterSelectionRef | null,
  multiclassEntries: BuilderMulticlassEntry[],
  multiclassClassData: (Class | null)[],
  excludeMulticlassIndex: number,
): BuilderClassLevelEntry[] {
  const entries: BuilderClassLevelEntry[] = [];

  if (primaryClassRef && primaryClassData) {
    entries.push({
      classRef: primaryClassRef,
      classData: primaryClassData,
      level: primaryLevel,
      subclass: primarySubclass,
      isPrimary: true,
    });
  }

  multiclassEntries.forEach((entry, index) => {
    if (index === excludeMulticlassIndex) return;
    if (!entry.classRef || !multiclassClassData[index]) return;
    entries.push({
      classRef: entry.classRef,
      classData: multiclassClassData[index],
      level: entry.level,
      subclass: entry.subclass,
      isPrimary: false,
    });
  });

  return entries;
}

function resolveCasterContribution(
  classData: Class,
  classLevel: number,
  subclassName: string | null,
  edition?: "classic" | "one",
): number {
  const name = classData.name.toLowerCase();
  const progression = classData.casterProgression;

  if (progression === "full" || FULL_CASTERS.has(name)) {
    return classLevel;
  }

  if (progression === "1/2" || HALF_CASTERS.has(name)) {
    return edition === "one"
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

export function getMulticlassCasterLevel(
  classEntries: BuilderClassLevelEntry[],
): number {
  let total = 0;
  let hasPact = false;

  for (const entry of classEntries) {
    if (!entry.classData || entry.level < 1) continue;
    const subclassName = entry.subclass?.name ?? null;

    if (entry.classData.casterProgression === "pact") {
      hasPact = true;
      continue;
    }

    total += resolveCasterContribution(
      entry.classData,
      entry.level,
      subclassName,
      entry.classData.edition,
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
  classEntries: BuilderClassLevelEntry[],
): boolean {
  let count = 0;
  for (const entry of classEntries) {
    if (!entry.classData || entry.level < 1) continue;
    const prog = entry.classData.casterProgression;
    if (prog && prog !== "none" && prog !== "pact") count++;
    if (prog === "pact") count++;
    const subclassName = entry.subclass?.name?.toLowerCase();
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

export interface MulticlassHitDicePool {
  display: string;
  pools: { faces: number; count: number; die: string }[];
}

export function getMulticlassHitDicePool(
  classEntries: BuilderClassLevelEntry[],
): MulticlassHitDicePool | null {
  const pools: { faces: number; count: number; die: string }[] = [];

  for (const entry of classEntries) {
    if (!entry.classData || entry.level < 1) continue;
    const faces = parseHitDieFaces(entry.classData.hitDie);
    if (!faces) continue;

    const existing = pools.find((p) => p.faces === faces);
    if (existing) {
      existing.count += entry.level;
    } else {
      pools.push({
        faces,
        count: entry.level,
        die: entry.classData.hitDie,
      });
    }
  }

  if (!pools.length) return null;

  pools.sort((a, b) => b.faces - a.faces);
  return {
    display: pools.map((p) => `${p.count}${p.die}`).join(" + "),
    pools,
  };
}

export function getMulticlassHitPointBreakdown(
  classEntries: BuilderClassLevelEntry[],
  conModifier: number,
  featBonuses: FeatHitPointBonus[] = [],
): { max: number; hitDice: string; tooltip: string } | null {
  const levelOrder = buildLevelOrder(classEntries);
  if (!levelOrder.length) return null;

  const hitDicePool = getMulticlassHitDicePool(classEntries);
  if (!hitDicePool) return null;

  let classTotal = 0;
  const lines: string[] = [];

  for (let charLevel = 1; charLevel <= levelOrder.length; charLevel++) {
    const classIndex = levelOrder[charLevel - 1];
    const entry = classEntries[classIndex];
    if (!entry?.classData) continue;

    const faces = parseHitDieFaces(entry.classData.hitDie);
    if (!faces) continue;

    const fixedPerLevel = getFixedHpPerLevel(faces);
    const gain =
      charLevel === 1
        ? Math.max(1, faces + conModifier)
        : Math.max(1, fixedPerLevel + conModifier);

    classTotal += gain;
    lines.push(
      charLevel === 1
        ? `Niv. ${charLevel} (${entry.classData.name}): ${entry.classData.hitDie} max + Con (${formatModifier(conModifier)}) = ${gain}`
        : `Niv. ${charLevel} (${entry.classData.name}): ${fixedPerLevel} + Con = ${gain}`,
    );
  }

  const featTotal = featBonuses.reduce((sum, b) => sum + b.amount, 0);
  for (const bonus of featBonuses) {
    lines.push(`Feat (${bonus.label}): +${bonus.amount}`);
  }
  lines.push(`Total: ${classTotal + featTotal}`);

  return {
    max: classTotal + featTotal,
    hitDice: hitDicePool.display,
    tooltip: lines.join("\n"),
  };
}

export function getFeatSlotLevelsForBuild(
  classEntries: BuilderClassLevelEntry[],
  totalLevel: number,
): number[] {
  const levelOrder = buildLevelOrder(classEntries);
  const slots = new Set<number>();

  for (const asiLevel of STANDARD_ASI_LEVELS) {
    if (asiLevel <= totalLevel) slots.add(asiLevel);
  }

  const fighterIndex = classEntries.findIndex(
    (e) => e.classData?.name.toLowerCase() === "fighter",
  );
  if (fighterIndex >= 0) {
    let fighterLevel = 0;
    for (let charLevel = 1; charLevel <= levelOrder.length; charLevel++) {
      if (levelOrder[charLevel - 1] === fighterIndex) {
        fighterLevel++;
        if (
          (FIGHTER_BONUS_ASI_CLASS_LEVELS as readonly number[]).includes(
            fighterLevel,
          )
        ) {
          slots.add(charLevel);
        }
      }
    }
  }

  return [...slots].sort((a, b) => a - b);
}

export function createEmptyMulticlassEntry(): BuilderMulticlassEntry {
  return { classRef: null, level: 1, subclass: null };
}

export const MAX_MULTICLASS_ENTRIES = 3;
