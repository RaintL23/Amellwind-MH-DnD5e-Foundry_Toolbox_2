import type { MonstieClassFeature } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function flattenEntries(entries: unknown[]): string[] {
  const lines: string[] = [];
  for (const entry of entries) {
    if (typeof entry === "string") {
      lines.push(parseFiveToolsMarkup(entry));
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    if (Array.isArray(e.items)) {
      for (const item of e.items) {
        lines.push(
          typeof item === "string"
            ? `• ${parseFiveToolsMarkup(item)}`
            : String(item),
        );
      }
    }
    if (Array.isArray(e.entries)) {
      lines.push(...flattenEntries(e.entries as unknown[]));
    }
  }
  return lines;
}

export function mapMonstieClassFeatures(rawList: unknown[]): MonstieClassFeature[] {
  const seen = new Set<string>();
  const features: MonstieClassFeature[] = [];

  for (const raw of rawList) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Raw;
    if (r.className !== "Monstie Sidekick") continue;

    const key = `${r.name}|${r.level}`;
    if (seen.has(key)) continue;
    seen.add(key);

    features.push({
      name: String(r.name ?? ""),
      level: Number(r.level ?? 0),
      page: typeof r.page === "number" ? r.page : undefined,
      entries: flattenEntries(Array.isArray(r.entries) ? r.entries : []),
    });
  }

  return features.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}
