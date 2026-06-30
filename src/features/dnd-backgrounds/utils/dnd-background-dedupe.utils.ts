import type { DndBackground } from "@/shared/types";
import { dedupeByNameWithVariants } from "@/shared/utils/dedupe-by-name.utils";

const CANONICAL_SOURCE_PRIORITY = ["XPHB", "PHB", "SCAG", "XGE", "TCE", "EFA"];

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
  return dedupeByNameWithVariants(backgrounds, {
    sourcePriority: CANONICAL_SOURCE_PRIORITY,
    buildSearchText,
    sort: (a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  });
}
