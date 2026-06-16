import { PROPERTY_LABELS } from "@/shared/types";
import type { ItemBaseIndexes } from "./item-raw.types";

function parsePropertyUid(raw: string): {
  abbreviation: string;
  source?: string;
} {
  const trimmed = raw.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe === -1) return { abbreviation: trimmed };
  return {
    abbreviation: trimmed.slice(0, pipe),
    source: trimmed.slice(pipe + 1),
  };
}

export function resolveItemPropertyLabel(
  propertyUid: string,
  indexes: ItemBaseIndexes,
): string {
  const { abbreviation, source } = parsePropertyUid(propertyUid);

  const lookupKeys = [
    source ? `${abbreviation}|${source}`.toLowerCase() : null,
    abbreviation.toLowerCase(),
  ].filter((key): key is string => key != null);

  for (const key of lookupKeys) {
    const entry = indexes.itemProperties.get(key);
    if (entry?.name) return entry.name;
  }

  return PROPERTY_LABELS[abbreviation] ?? abbreviation;
}

export function formatDndItemProperties(
  property: unknown[] | undefined,
  indexes: ItemBaseIndexes,
): string | null {
  if (!Array.isArray(property) || property.length === 0) return null;

  const labels = property.map((entry) =>
    resolveItemPropertyLabel(String(entry), indexes),
  );

  return labels.length > 0 ? labels.join(", ") : null;
}
