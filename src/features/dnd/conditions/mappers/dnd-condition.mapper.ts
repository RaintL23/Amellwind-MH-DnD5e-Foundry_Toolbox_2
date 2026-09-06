import type { DndCondition, DndDisease } from "@/shared/types";
import {
  mapStatBlockEntries,
  statBlockContentToPlainText,
} from "@/shared/utils/statblock-entries.mapper";

function buildSummary(content: ReturnType<typeof mapStatBlockEntries>): string {
  const text = content
    .map(statBlockContentToPlainText)
    .find((entry) => entry.trim().length > 0);
  if (!text) return "";
  return text.length > 220 ? `${text.slice(0, 220).trim()}…` : text;
}

function entryId(name: string, source: string): string {
  return `${name}::${source}`;
}

type RawEntry = Record<string, unknown>;

function mapSharedFields(raw: RawEntry) {
  const content = mapStatBlockEntries(
    Array.isArray(raw.entries) ? raw.entries : [],
  );
  return {
    id: entryId(String(raw.name ?? "Unknown"), String(raw.source ?? "PHB")),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "PHB"),
    page: typeof raw.page === "number" && raw.page > 0 ? raw.page : undefined,
    content,
    summary: buildSummary(content),
  };
}

export function mapDndCondition(
  raw: RawEntry,
  category: "condition" | "status" = "condition",
): DndCondition {
  return { ...mapSharedFields(raw), category };
}

export function mapDndDisease(raw: RawEntry): DndDisease {
  return mapSharedFields(raw);
}
