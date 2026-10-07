import { ClassLevelRow } from "@/shared/types";

export function getAllFeatureUids(progression: ClassLevelRow[]): string[] {
  return progression.flatMap((row) =>
    row.features.map((feature) => feature.uid),
  );
}

/** Toggles `uid` in the hidden set (returns a new Set). */
export function toggleHiddenFeature(
  hidden: Set<string>,
  uid: string,
): Set<string> {
  const next = new Set(hidden);
  if (next.has(uid)) next.delete(uid);
  else next.add(uid);
  return next;
}
