import { OptionalFeature } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/**
 * Renders a 5etools entries array to a flat list of display paragraphs.
 * Handles: plain strings, list objects, inset objects, nested entries objects.
 */
function renderEntries(entries: unknown[]): string[] {
  const result: string[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      const text = parseFiveToolsMarkup(entry).trim();
      if (text) result.push(text);
      continue;
    }

    if (typeof entry !== "object" || entry === null) continue;
    const obj = entry as Raw;

    if (obj.type === "list" && Array.isArray(obj.items)) {
      for (const item of obj.items as unknown[]) {
        if (typeof item === "string") {
          const text = parseFiveToolsMarkup(item).trim();
          if (text) result.push(`• ${text}`);
        }
      }
    } else if (
      (obj.type === "inset" || obj.type === "entries") &&
      Array.isArray(obj.entries)
    ) {
      result.push(...renderEntries(obj.entries as unknown[]));
    }
  }

  return result;
}

/**
 * Parses prerequisite.otherSummary.entry strings like:
 *   "Accel Axe (Uncommon)" → { weaponName: "Accel Axe", rarity: "Uncommon" }
 *   "Gunlance"             → { weaponName: "Gunlance", rarity: undefined }
 */
function parsePrerequisite(raw: Raw): { weaponName: string; rarity?: string } {
  const entry: string =
    raw?.prerequisite?.[0]?.otherSummary?.entry ?? "";

  const match = entry.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { weaponName: match[1].trim(), rarity: match[2].trim() };
  }

  return { weaponName: entry.trim() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOptionalFeature(raw: any): OptionalFeature {
  const entries = Array.isArray(raw.entries) ? (raw.entries as unknown[]) : [];
  const { weaponName, rarity } = parsePrerequisite(raw as Raw);

  return {
    name: String(raw.name ?? ""),
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    featureType: Array.isArray(raw.featureType)
      ? raw.featureType.map(String)
      : [],
    weaponName,
    prerequisiteRarity: rarity,
    paragraphs: renderEntries(entries),
  };
}
