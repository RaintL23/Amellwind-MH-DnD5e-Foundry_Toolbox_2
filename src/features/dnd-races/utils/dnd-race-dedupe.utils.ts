import type { DndRace, DndRaceKind } from "@/shared/types";

const CANONICAL_SOURCE_PRIORITY = ["XPHB", "PHB", "MPMM", "VGM", "EEPC", "EGW"];

const KIND_SORT_ORDER: Record<DndRaceKind, number> = {
  species: 0,
  subrace: 1,
  lineage: 2,
};

/** Group key: parent species name, or own name for root species. */
export function getRaceGroupName(race: DndRace): string {
  return race.parentName ?? race.name;
}

function getKindSortOrder(race: DndRace): number {
  // Root entries (no parent) always lead their group, even if tagged as lineage.
  if (!race.parentName) return 0;
  return KIND_SORT_ORDER[race.kind];
}

export function compareRacesForGroupedList(a: DndRace, b: DndRace): number {
  const byGroup = getRaceGroupName(a).localeCompare(getRaceGroupName(b), undefined, {
    sensitivity: "base",
  });
  if (byGroup !== 0) return byGroup;

  const byKind = getKindSortOrder(a) - getKindSortOrder(b);
  if (byKind !== 0) return byKind;

  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function sortRacesForGroupedList(races: DndRace[]): DndRace[] {
  return [...races].sort(compareRacesForGroupedList);
}

function sourcePriority(source: string): number {
  const index = CANONICAL_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? CANONICAL_SOURCE_PRIORITY.length : index;
}

function pickCanonicalRace(group: DndRace[]): DndRace {
  return [...group].sort((a, b) => {
    const byPriority = sourcePriority(a.source) - sourcePriority(b.source);
    if (byPriority !== 0) return byPriority;
    return a.source.localeCompare(b.source);
  })[0];
}

function buildSearchText(group: DndRace[]): string {
  const parts: string[] = [];
  for (const race of group) {
    parts.push(
      race.name,
      race.source,
      ...(race.traitTags ?? []),
      ...(race.parentName ? [race.parentName] : []),
    );
  }
  return parts.join(" ").toLowerCase();
}

/**
 * One row per race name. Aggregates variant sources for filtering and dialog.
 */
export function dedupeDndRacesByName(races: DndRace[]): DndRace[] {
  const byName = new Map<string, DndRace[]>();
  for (const race of races) {
    const group = byName.get(race.name) ?? [];
    group.push(race);
    byName.set(race.name, group);
  }

  const list = Array.from(byName.values()).map((group) => {
    const canonical = pickCanonicalRace(group);
    const variantSources = [...new Set(group.map((r) => r.source))].sort((a, b) =>
      a.localeCompare(b),
    );
    return {
      ...canonical,
      variantCount: group.length,
      variantSources,
      searchText: buildSearchText(group),
    };
  });

  return sortRacesForGroupedList(list);
}
