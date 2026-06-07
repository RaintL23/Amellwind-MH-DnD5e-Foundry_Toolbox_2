import type { DndBackground } from "@/shared/types";

const CANONICAL_SOURCE_PRIORITY = ["XPHB", "PHB", "SCAG", "XGE", "TCE", "EFA"];

function sourcePriority(source: string): number {
  const index = CANONICAL_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? CANONICAL_SOURCE_PRIORITY.length : index;
}

function pickCanonicalBackground(group: DndBackground[]): DndBackground {
  return [...group].sort((a, b) => {
    const byPriority = sourcePriority(a.source) - sourcePriority(b.source);
    if (byPriority !== 0) return byPriority;
    return a.source.localeCompare(b.source);
  })[0];
}

function buildSearchText(group: DndBackground[]): string {
  const parts: string[] = [];
  for (const bg of group) {
    parts.push(
      bg.name,
      bg.source,
      bg.proficiencies.skills,
      bg.proficiencies.tools,
      bg.proficiencies.languages,
      ...(bg.featSummary ? [bg.featSummary] : []),
      ...(bg.abilitySummary ? [bg.abilitySummary] : []),
    );
  }
  return parts.join(" ").toLowerCase();
}

/**
 * One row per background name. Aggregates variant sources for filtering and dialog.
 */
export function dedupeDndBackgroundsByName(
  backgrounds: DndBackground[],
): DndBackground[] {
  const byName = new Map<string, DndBackground[]>();
  for (const bg of backgrounds) {
    const group = byName.get(bg.name) ?? [];
    group.push(bg);
    byName.set(bg.name, group);
  }

  return Array.from(byName.values())
    .map((group) => {
      const canonical = pickCanonicalBackground(group);
      const variantSources = [...new Set(group.map((b) => b.source))].sort(
        (a, b) => a.localeCompare(b),
      );
      return {
        ...canonical,
        variantCount: group.length,
        variantSources,
        searchText: buildSearchText(group),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
