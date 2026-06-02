import { ClassLevelRow } from "@/shared/types";

export function getAllFeatureUids(progression: ClassLevelRow[]): string[] {
  return progression.flatMap((row) =>
    row.features.map((feature) => feature.uid),
  );
}

function allFeaturesEnabled(
  enabled: Set<string>,
  allUids: string[],
): boolean {
  return allUids.length > 0 && allUids.every((id) => enabled.has(id));
}

export function setAllFeatureUids(allUids: string[]): Set<string> {
  return new Set(allUids);
}

export function nextFeatureSelection(
  prev: Set<string>,
  uid: string,
  allUids: string[],
): Set<string> {
  const allSet = setAllFeatureUids(allUids);

  if (allFeaturesEnabled(prev, allUids)) {
    return new Set([uid]);
  }

  if (prev.has(uid)) {
    const next = new Set(prev);
    next.delete(uid);
    return next.size === 0 ? allSet : next;
  }

  const next = new Set(prev);
  next.add(uid);
  return next.size === allUids.length ? allSet : next;
}
