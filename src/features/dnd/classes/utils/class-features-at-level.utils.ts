import type { Class, ClassFeatureEntry, Subclass } from "@/shared/types";
import { mergeProgressionWithSubclass } from "@/features/dnd/classes/mappers/class.mapper";

/** Class (+ subclass) features gained up to `level`, without archetype placeholders. */
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
      // Archetype placeholders are omitted once a subclass is merged in;
      // without a subclass they are never real features.
      row.features.filter((f) => !f.gainSubclassFeature),
    );
}
