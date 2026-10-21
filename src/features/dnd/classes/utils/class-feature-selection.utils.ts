import { ClassLevelRow } from "@/shared/types";

export function getAllFeatureUids(progression: ClassLevelRow[]): string[] {
  return progression.flatMap((row) =>
    row.features.map((feature) => feature.uid),
  );
}

/**
 * Eye toggle on the hidden set (returns a new Set). From the "all visible"
 * state the first click solos `uid`; later clicks add/remove features, and
 * hiding the last visible one restores everything.
 */
export function toggleHiddenFeature(
  hidden: Set<string>,
  uid: string,
  allUids: string[],
): Set<string> {
  if (hidden.size === 0) {
    return new Set(allUids.filter((id) => id !== uid));
  }

  const next = new Set(hidden);
  if (next.has(uid)) next.delete(uid);
  else next.add(uid);
  return next.size >= allUids.length ? new Set() : next;
}
