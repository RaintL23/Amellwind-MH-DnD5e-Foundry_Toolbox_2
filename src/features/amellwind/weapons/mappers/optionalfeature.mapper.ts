import { OptionalFeature } from "@/shared/types";
import {
  PLAIN_ENTRY_OPTIONS,
  renderFiveToolsEntries,
} from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

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
    paragraphs: renderFiveToolsEntries(entries, PLAIN_ENTRY_OPTIONS),
  };
}
