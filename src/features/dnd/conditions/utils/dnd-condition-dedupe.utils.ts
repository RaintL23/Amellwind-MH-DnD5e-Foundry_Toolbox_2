import type { DndCondition, DndDisease } from "@/shared/types";
import { dedupeByNameWithVariants } from "@/shared/utils/dedupe-by-name.utils";

const SOURCE_PRIORITY = ["XPHB", "XDMG", "PHB", "DMG"];

function buildSearchText(
  group: Array<{ name: string; source: string; summary: string }>,
): string {
  return group
    .map((item) => `${item.name} ${item.source} ${item.summary}`)
    .join(" ")
    .toLowerCase();
}

export function dedupeDndConditionsByName(
  items: DndCondition[],
): DndCondition[] {
  return dedupeByNameWithVariants(items, {
    sourcePriority: SOURCE_PRIORITY,
    buildSearchText,
  });
}

export function dedupeDndDiseasesByName(items: DndDisease[]): DndDisease[] {
  return dedupeByNameWithVariants(items, {
    sourcePriority: SOURCE_PRIORITY,
    buildSearchText,
  });
}
