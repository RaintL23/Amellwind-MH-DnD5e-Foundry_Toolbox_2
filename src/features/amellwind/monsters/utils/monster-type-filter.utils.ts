import type { Monster } from "@/shared/types";

/** Separator between base creature type and MH subtype tag in filter values. */
export const MONSTER_TYPE_TAG_SEP = ":";

export interface MonsterTypeTaxonomyEntry {
  type: string;
  /** Sorted unique tags present on monsters of this base type. */
  tags: string[];
}

function capitalizeWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMonsterTypeLabel(type: string): string {
  return capitalizeWord(type);
}

export function formatMonsterTypeTagLabel(type: string, tag: string): string {
  return `${capitalizeWord(tag)} ${capitalizeWord(type)}`;
}

export function encodeMonsterTypeFilterValue(
  type: string,
  tag?: string,
): string {
  if (!tag) return type;
  return `${type}${MONSTER_TYPE_TAG_SEP}${tag}`;
}

export function parseMonsterTypeFilterValue(value: string): {
  type: string;
  tag?: string;
} {
  const sep = value.indexOf(MONSTER_TYPE_TAG_SEP);
  if (sep <= 0) return { type: value };
  return {
    type: value.slice(0, sep),
    tag: value.slice(sep + MONSTER_TYPE_TAG_SEP.length) || undefined,
  };
}

/** Collect base types and their MH subtype tags from the loaded monster list. */
export function buildMonsterTypeTaxonomy(
  monsters: Iterable<Pick<Monster, "type">>,
): MonsterTypeTaxonomyEntry[] {
  const byType = new Map<string, Set<string>>();

  for (const monster of monsters) {
    const type = monster.type.type;
    if (!type) continue;
    let tags = byType.get(type);
    if (!tags) {
      tags = new Set();
      byType.set(type, tags);
    }
    for (const tag of monster.type.tags ?? []) {
      const normalized = tag.trim().toLowerCase();
      if (normalized) tags.add(normalized);
    }
  }

  return [...byType.entries()]
    .map(([type, tags]) => ({
      type,
      tags: [...tags].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.type.localeCompare(b.type));
}

export function monsterMatchesTypeFilters(
  monster: Pick<Monster, "type">,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;

  const base = monster.type.type;
  const tags = (monster.type.tags ?? []).map((t) => t.trim().toLowerCase());

  return selected.some((value) => {
    const { type, tag } = parseMonsterTypeFilterValue(value);
    if (type !== base) return false;
    if (!tag) return true;
    return tags.includes(tag.toLowerCase());
  });
}
