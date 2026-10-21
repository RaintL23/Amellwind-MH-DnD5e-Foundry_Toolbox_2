import type {
  BuilderAsiChoices,
  BuilderFeatSelection,
  Class,
} from "@/shared/types";
import type { BuilderFeatSlot } from "@/shared/types";

const STANDARD_ASI_LEVELS = [4, 8, 12, 16, 19] as const;
const FIGHTER_EXTRA_ASI_LEVELS = [6, 14] as const;
const ROGUE_EXTRA_ASI_LEVELS = [10] as const;

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
  if (!choices) return "Unassigned";
  if (choices.mode === "plus2") {
    return choices.plus2 ? `+2 ${choices.plus2.toUpperCase()}` : "Unassigned";
  }
  const parts: string[] = [];
  if (choices.plus1a) parts.push(`+1 ${choices.plus1a.toUpperCase()}`);
  if (choices.plus1b) parts.push(`+1 ${choices.plus1b.toUpperCase()}`);
  return parts.length > 0 ? parts.join(", ") : "Unassigned";
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

/** Class levels that grant an ASI / feat (Fighter 6 & 14, Rogue 10 extra). */
export function getClassAsiLevels(className: string): number[] {
  const name = className.toLowerCase();
  const extras =
    name === "fighter"
      ? FIGHTER_EXTRA_ASI_LEVELS
      : name === "rogue"
        ? ROGUE_EXTRA_ASI_LEVELS
        : [];
  return [...STANDARD_ASI_LEVELS, ...extras].sort((a, b) => a - b);
}

export function getFeatSlotLevels(className: string, level: number): number[] {
  return getClassAsiLevels(className).filter((l) => l <= level);
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

export function isOptionalOriginFeatSlot(
  slot: string | null,
): slot is import("@/shared/types").BuilderOptionalOriginFeatSlot {
  return typeof slot === "string" && /^origin-feat-opt-\d+$/.test(slot);
}

export function parseOptionalOriginFeatSlotIndex(
  slot: import("@/shared/types").BuilderOptionalOriginFeatSlot,
): number {
  return Number(slot.replace("origin-feat-opt-", ""));
}

export function toOptionalOriginFeatSlot(
  index: number,
): import("@/shared/types").BuilderOptionalOriginFeatSlot {
  return `origin-feat-opt-${index}`;
}

/** Pact casters (Warlock) use a unified prepared list + shared slot level. */
export function isPactMagicClass(
  classData: Pick<Class, "casterProgression"> | null | undefined,
): boolean {
  return classData?.casterProgression === "pact";
}

export function getSpellcastingSectionLabel(
  classData: Pick<Class, "name" | "casterProgression"> | null | undefined,
): string {
  return isPactMagicClass(classData) ? "Pact Magic" : "Spellcasting";
}
