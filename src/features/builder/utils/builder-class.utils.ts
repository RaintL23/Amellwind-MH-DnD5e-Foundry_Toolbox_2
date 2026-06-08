import type {
  BuilderAsiChoices,
  BuilderFeatSelection,
  Class,
  ClassFeatureEntry,
  Subclass,
} from "@/shared/types";
import type { BuilderFeatSlot } from "@/shared/types";
import { mergeProgressionWithSubclass } from "@/features/classes/mappers/class.mapper";

const STANDARD_ASI_LEVELS = [4, 8, 12, 16, 19] as const;
const FIGHTER_EXTRA_ASI_LEVELS = [6, 14] as const;

export const ABILITY_SCORE_IMPROVEMENT = {
  id: "asi",
  name: "Ability Score Improvement",
} as const;

export const DEFAULT_ASI_CHOICES: BuilderAsiChoices = {
  mode: "plus2",
  plus2: null,
  plus1a: null,
  plus1b: null,
};

export function isAsiFeatSelection(selection: BuilderFeatSelection): boolean {
  return (
    selection.source === "asi" ||
    selection.name === ABILITY_SCORE_IMPROVEMENT.name
  );
}

export function formatAsiChoicesSummary(choices: BuilderAsiChoices | undefined): string {
  if (!choices) return "Sin asignar";
  if (choices.mode === "plus2") {
    return choices.plus2 ? `+2 ${choices.plus2.toUpperCase()}` : "Sin asignar";
  }
  const parts: string[] = [];
  if (choices.plus1a) parts.push(`+1 ${choices.plus1a.toUpperCase()}`);
  if (choices.plus1b) parts.push(`+1 ${choices.plus1b.toUpperCase()}`);
  return parts.length > 0 ? parts.join(", ") : "Sin asignar";
}

export function getSubclassGainLevel(classData: Class): number | null {
  for (const row of classData.progression) {
    if (row.features.some((f) => f.gainSubclassFeature)) {
      return row.level;
    }
  }
  return null;
}

export function isSubclassLevelReached(
  classData: Class | null,
  level: number,
): boolean {
  if (!classData) return false;
  const gainLevel = getSubclassGainLevel(classData);
  return gainLevel !== null && level >= gainLevel;
}

export function getFeatSlotLevels(className: string, level: number): number[] {
  const extras =
    className.toLowerCase() === "fighter" ? [...FIGHTER_EXTRA_ASI_LEVELS] : [];
  const all = [...STANDARD_ASI_LEVELS, ...extras].sort((a, b) => a - b);
  return all.filter((l) => l <= level);
}

export function getFeaturesUpToLevel(
  classData: Class,
  subclass: Subclass | null,
  level: number,
): ClassFeatureEntry[] {
  const progression = mergeProgressionWithSubclass(
    classData.progression,
    subclass,
  );

  return progression
    .filter((row) => row.level <= level)
    .flatMap((row) =>
      row.features.filter(
        (f) => !f.gainSubclassFeature || subclass !== null,
      ),
    );
}

export function isFeatSlotSelection(
  slot: string | null,
): slot is BuilderFeatSlot {
  return typeof slot === "string" && /^feat-\d+$/.test(slot);
}

export function parseFeatSlotIndex(slot: BuilderFeatSlot): number {
  return Number(slot.replace("feat-", ""));
}

export function toFeatSlot(index: number): BuilderFeatSlot {
  return `feat-${index}`;
}

export function isOriginFeatSlot(
  slot: string | null,
): slot is "origin-feat" {
  return slot === "origin-feat";
}
