import type { Class, ClassFeatureEntry, Subclass } from "@/shared/types";
import type { BuilderFeatSlot } from "@/shared/types";
import { mergeProgressionWithSubclass } from "@/features/classes/mappers/class.mapper";

const STANDARD_ASI_LEVELS = [4, 8, 12, 16, 19] as const;
const FIGHTER_EXTRA_ASI_LEVELS = [6, 14] as const;

export const ABILITY_SCORE_IMPROVEMENT = {
  id: "asi",
  name: "Ability Score Improvement",
} as const;

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
