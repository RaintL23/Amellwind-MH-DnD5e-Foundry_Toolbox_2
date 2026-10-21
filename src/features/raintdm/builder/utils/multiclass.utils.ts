import type {
  AbilityKey,
  AbilityScores,
  BuilderMulticlassEntry,
  BuilderMulticlassClassSlot,
  BuilderMulticlassSpellSlot,
  BuilderMulticlassSubclassSlot,
  Class,
  CharacterSelectionRef,
  Subclass,
} from "@/shared/types";
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import {
  getFixedHpPerLevel,
  parseHitDieFaces,
  type FeatHitPointBonus,
} from "./character-hit-points";
import { formatModifier } from "@/shared/utils/cr.utils";
import { ABILITY_NAMES } from "@/shared/constants/dnd";
import { formatMulticlassRequirements } from "@/features/dnd/classes/mappers/class-multiclass.mapper";
import { getClassAsiLevels } from "./builder-class.utils";
import {
  resolveOptionalFeatureProgressions,
  type ResolvedOptionalFeatureProgression,
} from "./class-optional-features.utils";

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

const MULTICLASS_SPELL_SLOT_RE = /^multiclass-(\d+):(.+)$/;

export function toMulticlassSpellSlot(
  index: number,
  innerSlot: string,
): BuilderMulticlassSpellSlot {
  return `multiclass-${index}:${innerSlot}`;
}

export function isMulticlassSpellSlot(
  slot: string | null,
): slot is BuilderMulticlassSpellSlot {
  return typeof slot === "string" && MULTICLASS_SPELL_SLOT_RE.test(slot);
}

/** Splits `multiclass-<i>:<inner>` into the entry index and its inner spell slot. */
export function parseMulticlassSpellSlot(
  slot: BuilderMulticlassSpellSlot,
): { index: number; innerSlot: string } {
  const match = MULTICLASS_SPELL_SLOT_RE.exec(slot);
  return match
    ? { index: Number(match[1]), innerSlot: match[2] }
    : { index: -1, innerSlot: "" };
}

// ─── Additional class context ───────────────────────────────────────────────

/** Loaded data of one additional class, resolved at its own class level. */
export interface MulticlassEntryContext {
  index: number;
  entry: BuilderMulticlassEntry;
  classData: Class;
  subclassData: Subclass | null;
  /** Optional-feature progressions (Fighting Style, Invocations…) at the entry level. */
  progressions: ResolvedOptionalFeatureProgression[];
}

export function resolveSubclassData(
  classData: Class | null,
  subclassRef: CharacterSelectionRef | null,
): Subclass | null {
  if (!classData || !subclassRef) return null;
  return (
    subclassesForClassVariant(classData).find((sc) => sc.id === subclassRef.id) ??
    classData.subclasses.find((sc) => sc.id === subclassRef.id) ??
    null
  );
}

/** Additional classes with a chosen class whose data matches the entry (stale loads skipped). */
export function resolveMulticlassEntryContexts(
  entries: BuilderMulticlassEntry[],
  classData: (Class | null)[],
): MulticlassEntryContext[] {
  return entries.flatMap((entry, index) => {
    const data = classData[index];
    if (!entry.classRef || !data || data.id !== entry.classRef.id) return [];
    const subclassData = resolveSubclassData(data, entry.subclass);
    return [
      {
        index,
        entry,
        classData: data,
        subclassData,
        progressions: resolveOptionalFeatureProgressions(
          data,
          subclassData,
          entry.level,
        ),
      },
    ];
  });
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
  /** Unmet requirement, e.g. "Strength 13 or Dexterity 13". */
  requirement: string;
  /** Current scores of the abilities involved, e.g. "Strength 10, Dexterity 12". */
  current: string;
}

function meetsRequirementGroup(
  group: Partial<Record<AbilityKey, number>>,
  abilityScores: AbilityScores,
): boolean {
  return (Object.entries(group) as [AbilityKey, number][]).every(
    ([ability, minimum]) => abilityScores[ability] >= minimum,
  );
}

/**
 * Every class in the build (primary included) must meet its own prerequisite:
 * any one requirement group, with all abilities in that group at the minimum.
 */
export function collectPrerequisiteFailures(
  classEntries: BuilderClassLevelEntry[],
  abilityScores: AbilityScores,
): PrerequisiteFailure[] {
  const failures: PrerequisiteFailure[] = [];

  for (const entry of classEntries) {
    if (!entry.classRef || !entry.classData) continue;
    const groups = entry.classData.multiclassRequirements;
    if (!groups?.length) continue;
    if (groups.some((group) => meetsRequirementGroup(group, abilityScores))) {
      continue;
    }

    const abilities = [
      ...new Set(groups.flatMap((g) => Object.keys(g) as AbilityKey[])),
    ];
    failures.push({
      className: entry.classData.name,
      requirement: formatMulticlassRequirements(groups),
      current: abilities
        .map((ability) => `${ABILITY_LABELS[ability]} ${abilityScores[ability]}`)
        .join(", "),
    });
  }

  return failures;
}

function formatPrerequisiteFailureLine(failure: PrerequisiteFailure): string {
  return `${failure.className}: needs ${failure.requirement} (you have ${failure.current})`;
}

/** User-facing summary for library disabled rows. */
export function formatPrerequisiteFailureReason(
  failures: PrerequisiteFailure[],
): string {
  if (!failures.length) return "";
  return `Prerequisites not met: ${failures.map(formatPrerequisiteFailureLine).join("; ")}`;
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
        ? `Lvl ${charLevel} (${entry.classData.name}): ${entry.classData.hitDie} max + Con (${formatModifier(conModifier)}) = ${gain}`
        : `Lvl ${charLevel} (${entry.classData.name}): ${fixedPerLevel} + Con = ${gain}`,
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

/**
 * Feat/ASI slots (as character levels) for a multiclass build. ASIs are class
 * features, so each class grants them at its own class levels; character
 * levels follow {@link buildLevelOrder}.
 */
export function getFeatSlotLevelsForBuild(
  classEntries: BuilderClassLevelEntry[],
  totalLevel: number,
): number[] {
  const levelOrder = buildLevelOrder(classEntries);
  const classLevels = classEntries.map(() => 0);
  const asiLevels = classEntries.map((e) =>
    getClassAsiLevels(e.classData?.name ?? e.classRef?.name ?? ""),
  );
  const slots: number[] = [];

  const maxLevel = Math.min(totalLevel, levelOrder.length);
  for (let charLevel = 1; charLevel <= maxLevel; charLevel++) {
    const classIndex = levelOrder[charLevel - 1];
    classLevels[classIndex] += 1;
    // Empty "Class N" rows have no features yet.
    if (!classEntries[classIndex].classRef) continue;
    if (asiLevels[classIndex].includes(classLevels[classIndex])) {
      slots.push(charLevel);
    }
  }

  return slots;
}

export function createEmptyMulticlassEntry(): BuilderMulticlassEntry {
  return { classRef: null, level: 1, subclass: null };
}

export const MAX_MULTICLASS_ENTRIES = 3;
