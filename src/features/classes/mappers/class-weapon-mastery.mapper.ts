import type { OptionalFeatureProgression } from "@/shared/types";
import { WEAPON_MASTERY_OPTIONS } from "@/features/builder/data/weapon-mastery.data";
import { DEFAULT_CLASS_SOURCE } from "../utils/class-raw.types";
import type { RawClassFeature, RawClassTableGroup } from "../utils/class-raw.types";
import {
  classId,
  progressionFromTableColumn,
} from "@/features/classes/mappers/class-table.mapper";

const WEAPON_MASTERY_COUNT_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/** Parses "two kinds of … weapons" from raw 5etools feature entries. */
function parseWeaponMasteryCountFromEntries(
  entries: unknown[] | undefined,
): number | null {
  if (!entries?.length) return null;

  const text = entries
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();

  if (!/weapon mastery|mastery properties/.test(text)) return null;

  const wordMatch = text.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+kinds?\s+of\b/,
  );
  if (wordMatch) {
    return WEAPON_MASTERY_COUNT_WORDS[wordMatch[1]] ?? null;
  }

  const digitMatch = text.match(/\b(\d+)\s+kinds?\s+of\b/);
  if (digitMatch) {
    const count = parseInt(digitMatch[1], 10);
    return Number.isNaN(count) ? null : count;
  }

  return null;
}

function findWeaponMasteryClassFeature(
  className: string,
  classSource: string,
  classFeatures: RawClassFeature[],
): RawClassFeature | null {
  return (
    classFeatures.find(
      (feature) =>
        feature.name === "Weapon Mastery" &&
        feature.className === className &&
        (feature.classSource || DEFAULT_CLASS_SOURCE) === classSource,
    ) ?? null
  );
}

function makeWeaponMasteryProgression(
  className: string,
  classSource: string,
  progression: Record<string, number>,
): OptionalFeatureProgression {
  return {
    id: `wm-${className.toLowerCase()}-${classSource.toLowerCase()}`,
    name: "Weapon Mastery",
    featureTypes: [],
    catalog: "feature-choice",
    pickMode: "one",
    choiceOptions: WEAPON_MASTERY_OPTIONS,
    scope: "class",
    ownerId: classId(className, classSource),
    progression,
  };
}

/**
 * Builds a Weapon Mastery pick progression from the class table column when
 * present (Fighter, Barbarian), or from the level-1 feature text when the
 * count is fixed in prose (Ranger, Paladin: "two kinds of weapons …").
 */
export function buildWeaponMasteryProgression(
  className: string,
  classSource: string,
  tableGroups: RawClassTableGroup[] | undefined,
  classFeatures: RawClassFeature[],
): OptionalFeatureProgression | null {
  const fromTable = tableGroups?.length
    ? progressionFromTableColumn(tableGroups)
    : null;
  if (fromTable) {
    return makeWeaponMasteryProgression(className, classSource, fromTable);
  }

  const feature = findWeaponMasteryClassFeature(
    className,
    classSource,
    classFeatures,
  );
  if (!feature) return null;

  const count = parseWeaponMasteryCountFromEntries(feature.entries);
  if (!count || count < 1) return null;

  return makeWeaponMasteryProgression(className, classSource, {
    [String(feature.level)]: count,
  });
}
