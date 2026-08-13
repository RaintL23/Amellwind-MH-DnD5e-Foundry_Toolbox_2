import type { DndFeat } from "@/shared/types";
import { dedupeByNameWithVariants } from "@/shared/utils/dedupe-by-name.utils";

const CANONICAL_SOURCE_PRIORITY = ["XPHB", "PHB", "XGE", "TCE", "EFA", "SCAG"];

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
  return dedupeByNameWithVariants(feats, {
    sourcePriority: CANONICAL_SOURCE_PRIORITY,
    buildSearchText,
    sort: (a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  });
}
