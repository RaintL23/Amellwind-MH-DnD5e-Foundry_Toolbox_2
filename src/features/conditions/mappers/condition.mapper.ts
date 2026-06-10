import type { MhCondition } from "@/shared/types";
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

function mhEntryId(name: string, source: string): string {
  return `${name}::${source}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCondition(raw: any): MhCondition {
  const content = mapStatBlockEntries(
    Array.isArray(raw.entries) ? raw.entries : [],
  );

  return {
    id: mhEntryId(String(raw.name ?? "Unknown"), String(raw.source ?? "MHMM")),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "MHMM"),
    page: typeof raw.page === "number" && raw.page > 0 ? raw.page : undefined,
    content,
    summary: buildSummary(content),
  };
}
