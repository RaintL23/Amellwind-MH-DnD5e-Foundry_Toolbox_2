import type { FoundryItem } from "../types";

export function emitActivityOntoItem(
  item: FoundryItem,
  activity: Record<string, unknown>,
): void {
  const system = item.system as Record<string, unknown>;
  const activities =
    (system.activities as Record<string, unknown> | undefined) ?? {};
  const id = String(activity._id);
  activities[id] = activity;
  system.activities = activities;
}

export function linkEffectsToActivity(
  activity: Record<string, unknown>,
  effectIds: string[],
): void {
  if (effectIds.length === 0) return;
  activity.effects = effectIds.map((id) => ({ _id: id }));
}
