import type { DndFeat } from "@/shared/types";

const CANONICAL_SOURCE_PRIORITY = ["XPHB", "PHB", "XGE", "TCE", "EFA", "SCAG"];

function sourcePriority(source: string): number {
  const index = CANONICAL_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? CANONICAL_SOURCE_PRIORITY.length : index;
}

function pickCanonicalFeat(group: DndFeat[]): DndFeat {
  return [...group].sort((a, b) => {
    const byPriority = sourcePriority(a.source) - sourcePriority(b.source);
    if (byPriority !== 0) return byPriority;
    return a.source.localeCompare(b.source);
  })[0];
}

function buildSearchText(group: DndFeat[]): string {
  const parts: string[] = [];
  for (const feat of group) {
    parts.push(
      feat.name,
      feat.source,
      feat.summary,
      ...feat.prerequisites,
      ...feat.paragraphs,
    );
  }
  return parts.join(" ").toLowerCase();
}

/** One card per feat name. Aggregates variant sources for filtering and dialog. */
export function dedupeDndFeatsByName(feats: DndFeat[]): DndFeat[] {
  const byName = new Map<string, DndFeat[]>();
  for (const feat of feats) {
    const group = byName.get(feat.name) ?? [];
    group.push(feat);
    byName.set(feat.name, group);
  }

  return Array.from(byName.values())
    .map((group) => {
      const canonical = pickCanonicalFeat(group);
      const variantSources = [...new Set(group.map((f) => f.source))].sort(
        (a, b) => a.localeCompare(b),
      );
      return {
        ...canonical,
        variantCount: group.length,
        variantSources,
        searchText: buildSearchText(group),
      };
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
}
