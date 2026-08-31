import type { ListFilterOption } from "@/shared/components/list-filters";
import { formatTag } from "./rune-tag.utils";

export type RuneTagFilterCategory =
  | "weapon"
  | "class"
  | "damage"
  | "playStyle"
  | "other";

export const RUNE_TAG_FILTER_SECTION_IDS = {
  weapon: "tagWeapon",
  class: "tagClass",
  damage: "tagDamage",
  playStyle: "tagPlayStyle",
  other: "tag",
} as const;

const DAMAGE_RELATED_MECHANIC_PREFIXES = [
  "mechanic:damage-",
  "mechanic:extra-damage",
  "mechanic:against-damage",
  "mechanic:nonmagical-damage",
  "mechanic:spell-buff:damage",
  "mechanic:resistance-bypass",
  "mechanic:immunity-bypass",
  "mechanic:spell-bypass",
] as const;

const DAMAGE_RELATED_MECHANIC_TAGS = new Set([
  "mechanic:resistance",
  "mechanic:immunity",
  "mechanic:vulnerability",
  "mechanic:on-hit",
  "mechanic:damage-type-shift",
  "mechanic:hp-sacrifice",
  "mechanic:critical",
  "mechanic:extra-attack",
  "mechanic:attack-roll",
  "mechanic:reach",
  "mechanic:attack-range",
  "mechanic:forced-movement",
  "mechanic:grapple-on-hit",
  "mechanic:wound-crit",
  "mechanic:poison-dc-boost",
  "mechanic:ammo-buff",
]);

const PLAY_STYLE_TYPE_TAGS = new Set([
  "type:offensive",
  "type:defensive",
  "type:support",
]);

const PLAY_STYLE_MECHANIC_TAGS = new Set([
  "mechanic:passive",
  "mechanic:active",
]);

function isDamageRelatedMechanicTag(tag: string): boolean {
  if (DAMAGE_RELATED_MECHANIC_TAGS.has(tag)) return true;
  return DAMAGE_RELATED_MECHANIC_PREFIXES.some((prefix) =>
    tag.startsWith(prefix),
  );
}

/** Classifies a rune tag into a filter dialog category. */
export function categorizeRuneTag(tag: string): RuneTagFilterCategory {
  if (tag.startsWith("weapon-type:")) return "weapon";
  if (tag.startsWith("class:")) return "class";
  if (tag.startsWith("damage:") || isDamageRelatedMechanicTag(tag)) {
    return "damage";
  }
  if (
    PLAY_STYLE_TYPE_TAGS.has(tag) ||
    PLAY_STYLE_MECHANIC_TAGS.has(tag)
  ) {
    return "playStyle";
  }
  return "other";
}

export function splitTagsByCategory(
  tags: string[],
): Record<RuneTagFilterCategory, string[]> {
  const buckets: Record<RuneTagFilterCategory, string[]> = {
    weapon: [],
    class: [],
    damage: [],
    playStyle: [],
    other: [],
  };

  for (const tag of tags) {
    buckets[categorizeRuneTag(tag)].push(tag);
  }

  for (const category of Object.keys(buckets) as RuneTagFilterCategory[]) {
    buckets[category].sort();
  }

  return buckets;
}

export function tagOptionsFromValues(tags: string[]): ListFilterOption[] {
  return tags.map((tag) => ({
    value: tag,
    label: formatTag(tag),
  }));
}

/** Splits the persisted tag filter array into per-section dialog values. */
export function splitTagFilterSelections(tags: string[]): Record<
  (typeof RUNE_TAG_FILTER_SECTION_IDS)[keyof typeof RUNE_TAG_FILTER_SECTION_IDS],
  string[]
> {
  const buckets = splitTagsByCategory(tags);
  return {
    [RUNE_TAG_FILTER_SECTION_IDS.weapon]: buckets.weapon,
    [RUNE_TAG_FILTER_SECTION_IDS.class]: buckets.class,
    [RUNE_TAG_FILTER_SECTION_IDS.damage]: buckets.damage,
    [RUNE_TAG_FILTER_SECTION_IDS.playStyle]: buckets.playStyle,
    [RUNE_TAG_FILTER_SECTION_IDS.other]: buckets.other,
  };
}

/** Merges categorized dialog tag sections back into one filter array. */
export function mergeTagFilterSelections(values: {
  tagWeapon?: string[];
  tagClass?: string[];
  tagDamage?: string[];
  tagPlayStyle?: string[];
  tag?: string[];
}): string[] {
  return [
    ...(values.tagWeapon ?? []),
    ...(values.tagClass ?? []),
    ...(values.tagDamage ?? []),
    ...(values.tagPlayStyle ?? []),
    ...(values.tag ?? []),
  ];
}
