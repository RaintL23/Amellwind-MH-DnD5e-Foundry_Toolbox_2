import { DndItem } from "@/shared/types";

const CANONICAL_SOURCE_PRIORITY = [
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
