import {
  getListDndConditions,
  getListDndDiseases,
} from "@/features/dnd/conditions/services/dnd-condition.service";
import { getAllConditions } from "@/features/amellwind/conditions/services/condition.service";
import { getAllDiseases } from "@/features/amellwind/diseases/services/disease.service";
import type { StatBlockContent } from "@/shared/types/statblock-content.types";
import { statBlockContentsToPlainText } from "@/shared/utils/statblock-entries.mapper";
import type {
  PlayConditionKind,
  PlayConditionSource,
} from "./play-character.types";

export interface StatusCatalogEntry {
  id: string;
  name: string;
  summary?: string;
  content: StatBlockContent[];
  kind: PlayConditionKind;
  source: PlayConditionSource;
}

/** Full rules text for hover / persistence (summary alone is only the first block). */
export function catalogEntryDescription(entry: {
  content: StatBlockContent[];
  summary?: string;
}): string {
  const full = statBlockContentsToPlainText(entry.content).trim();
  return full || entry.summary?.trim() || "";
}

function dedupeByName(entries: StatusCatalogEntry[]): StatusCatalogEntry[] {
  const seen = new Map<string, StatusCatalogEntry>();
  for (const entry of entries) {
    const key = `${entry.source}|${entry.kind}|${entry.name.toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, entry);
  }
  return Array.from(seen.values());
}

let cachedPromise: Promise<StatusCatalogEntry[]> | null = null;

/** Module-level cache — shared by StatusChips and StatusSheet. */
export function loadStatusCatalog(): Promise<StatusCatalogEntry[]> {
  if (!cachedPromise) {
    cachedPromise = (async () => {
      const [dndC, dndD, mhC, mhD] = await Promise.all([
        getListDndConditions().catch(() => []),
        getListDndDiseases().catch(() => []),
        getAllConditions().catch(() => []),
        getAllDiseases().catch(() => []),
      ]);
      return dedupeByName([
        ...dndC.map((c) => ({
          id: c.id,
          name: c.name,
          summary: c.summary,
          content: c.content,
          kind: (c.category === "status"
            ? "status"
            : "condition") as PlayConditionKind,
          source: "dnd" as const,
        })),
        ...dndD.map((d) => ({
          id: d.id,
          name: d.name,
          summary: d.summary,
          content: d.content,
          kind: "disease" as const,
          source: "dnd" as const,
        })),
        ...mhC.map((c) => ({
          id: c.id,
          name: c.name,
          summary: c.summary,
          content: c.content,
          kind: "condition" as const,
          source: "amellwind" as const,
        })),
        ...mhD.map((d) => ({
          id: d.id,
          name: d.name,
          summary: d.summary,
          content: d.content,
          kind: "disease" as const,
          source: "amellwind" as const,
        })),
      ]);
    })().catch((err) => {
      cachedPromise = null;
      throw err;
    });
  }
  return cachedPromise;
}
