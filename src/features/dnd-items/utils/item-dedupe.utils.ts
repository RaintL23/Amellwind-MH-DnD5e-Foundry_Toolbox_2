import { DndItem } from "@/shared/types";

export const CANONICAL_SOURCE_PRIORITY = [
  "XDMG",
  "DMG",
  "XPHB",
  "PHB",
  "XGE",
  "TCE",
  "SCAG",
  "EGW",
  "FTD",
  "GGR",
  "AI",
  "ERLW",
  "MTF",
  "VGM",
  "MOT",
  "SCC",
  "BMT",
  "BAM",
  "BGG",
];

function sourcePriority(source: string): number {
  const index = CANONICAL_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? CANONICAL_SOURCE_PRIORITY.length : index;
}

/**
 * Canonical source priority, optionally biased toward 2014 books (PHB/DMG
 * before their 2024 XPHB/XDMG counterparts). Shared by the D&D equipment
 * catalogs (weapons/armor) so they no longer hard-code their own 2-entry lists.
 */
export function buildEquipmentSourcePriority(prefer2024: boolean): string[] {
  const priority = [...CANONICAL_SOURCE_PRIORITY];
  if (prefer2024) return priority;

  const swap = (a: string, b: string) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    if (ia >= 0 && ib >= 0) {
      [priority[ia], priority[ib]] = [priority[ib], priority[ia]];
    }
  };
  swap("XDMG", "DMG");
  swap("XPHB", "PHB");
  return priority;
}

/** Picks the highest-priority entry of a same-named group by its `source`. */
export function pickPreferredBySource<T extends { source?: string }>(
  group: T[],
  priority: string[],
): T {
  const rank = (source?: string): number => {
    const index = priority.indexOf(source ?? "");
    return index === -1 ? priority.length : index;
  };
  return [...group].sort((a, b) => {
    const byRank = rank(a.source) - rank(b.source);
    if (byRank !== 0) return byRank;
    return (a.source ?? "").localeCompare(b.source ?? "");
  })[0];
}

function pickCanonicalItem(group: DndItem[]): DndItem {
  return [...group].sort((a, b) => {
    const bySource = sourcePriority(a.source) - sourcePriority(b.source);
    if (bySource !== 0) return bySource;
    return a.source.localeCompare(b.source);
  })[0];
}

function buildSearchText(group: DndItem[]): string {
  const parts: string[] = [];
  for (const item of group) {
    parts.push(
      item.name,
      item.source,
      item.typeLabel,
      item.rarityLabel,
      item.category,
      item.description.join(" "),
      item.baseName ?? "",
      item.variantName ?? "",
    );
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/**
 * Una fila por nombre de objeto. Metadatos de variantes para filtros y diálogo.
 */
export function dedupeDndItemsByName(items: DndItem[]): DndItem[] {
  const byName = new Map<string, DndItem[]>();

  for (const item of items) {
    const group = byName.get(item.name) ?? [];
    group.push(item);
    byName.set(item.name, group);
  }

  return Array.from(byName.values()).map((group) => {
    const canonical = pickCanonicalItem(group);
    const variantSources = [...new Set(group.map((i) => i.source))].sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      ...canonical,
      variantCount: group.length,
      variantSources,
      searchText: buildSearchText(group),
    };
  });
}

export function getDndItemsByName(items: DndItem[], name: string): DndItem[] {
  return items
    .filter((i) => i.name === name)
    .sort((a, b) => {
      const byPriority = sourcePriority(a.source) - sourcePriority(b.source);
      if (byPriority !== 0) return byPriority;
      return a.source.localeCompare(b.source);
    });
}

export function sortDndItemVariants(items: DndItem[]): DndItem[] {
  return [...items].sort((a, b) => {
    const byPriority = sourcePriority(a.source) - sourcePriority(b.source);
    if (byPriority !== 0) return byPriority;
    return a.source.localeCompare(b.source);
  });
}
