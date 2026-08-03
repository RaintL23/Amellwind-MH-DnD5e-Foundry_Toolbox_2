import { PROPERTY_LABELS } from "@/shared/types";
import type {
  ItemBaseIndexes,
  ItemMasteryIndexEntry,
  ItemPropertyIndexEntry,
  ItemTypeIndexEntry,
  RawItemEntity,
} from "./item-raw.types";
import { unpackItemTypeUid } from "./item-uids.utils";

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

function parseMasteryUid(raw: string): { name: string; source?: string } {
  const trimmed = raw.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe === -1) return { name: trimmed };
  return {
    name: trimmed.slice(0, pipe).trim(),
    source: trimmed.slice(pipe + 1).trim() || undefined,
  };
}

/** Title-cases a 5etools ammoType uid (`bolt|xphb` → `Bolt`). */
export function formatAmmoTypeLabel(ammoType: string | undefined): string {
  if (!ammoType?.trim()) return "";
  const name = ammoType.split("|")[0].trim();
  return name.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function lookupPropertyEntry(
  propertyUid: string,
  indexes: ItemBaseIndexes,
  preferredSource?: string,
): ItemPropertyIndexEntry | undefined {
  const { abbreviation, source } = parsePropertyUid(propertyUid);
  const keys = [
    source ? `${abbreviation}|${source}`.toLowerCase() : null,
    preferredSource
      ? `${abbreviation}|${preferredSource}`.toLowerCase()
      : null,
    abbreviation.toLowerCase(),
  ].filter((key): key is string => key != null);

  for (const key of keys) {
    const entry = indexes.itemProperties.get(key);
    if (entry) return entry;
  }
  return undefined;
}

function lookupTypeEntry(
  typeCode: string | undefined,
  indexes: ItemBaseIndexes,
): ItemTypeIndexEntry | undefined {
  if (!typeCode) return undefined;
  const { abbreviation, source } = unpackItemTypeUid(typeCode);
  const keys = [
    source ? `${abbreviation}|${source}`.toLowerCase() : null,
    abbreviation.toLowerCase(),
  ].filter((key): key is string => key != null);

  for (const key of keys) {
    const entry = indexes.itemTypes.get(key);
    if (entry) return entry;
  }
  return undefined;
}

function lookupMasteryEntry(
  masteryUid: string,
  indexes: ItemBaseIndexes,
  preferredSource?: string,
): ItemMasteryIndexEntry | undefined {
  const { name, source } = parseMasteryUid(masteryUid);
  if (!name) return undefined;
  const keys = [
    source ? `${name}|${source}`.toLowerCase() : null,
    preferredSource ? `${name}|${preferredSource}`.toLowerCase() : null,
    name.toLowerCase(),
  ].filter((key): key is string => key != null);

  for (const key of keys) {
    const entry = indexes.itemMasteries.get(key);
    if (entry) return entry;
  }
  return undefined;
}

export function resolveItemPropertyLabel(
  propertyUid: string,
  indexes: ItemBaseIndexes,
  preferredSource?: string,
): string {
  const { abbreviation } = parsePropertyUid(propertyUid);
  const entry = lookupPropertyEntry(propertyUid, indexes, preferredSource);
  if (entry?.name) return entry.name;
  return PROPERTY_LABELS[abbreviation] ?? abbreviation;
}

/**
 * Applies a 5etools property `template` (e.g. Ammunition with range/ammo).
 * Falls back to the property display name when no template is present.
 */
export function formatPropertyWithTemplate(
  propertyUid: string,
  raw: RawItemEntity,
  indexes: ItemBaseIndexes,
): string {
  const propName = resolveItemPropertyLabel(
    propertyUid,
    indexes,
    raw.source,
  );
  const entry = lookupPropertyEntry(propertyUid, indexes, raw.source);
  const template = entry?.template?.trim();
  if (!template) return propName;

  return template
    .replace(/\{\{prop_name\}\}/g, propName)
    .replace(/\{\{prop_name_lower\}\}/g, propName.toLowerCase())
    .replace(/\{\{item\.range\}\}/g, String(raw.range ?? ""))
    .replace(
      /\{\{item\.ammoType\}\}/g,
      formatAmmoTypeLabel(
        typeof raw.ammoType === "string" ? raw.ammoType : undefined,
      ),
    )
    .replace(/\{\{item\.dmg2\}\}/g, String(raw.dmg2 ?? ""))
    .replace(/\{\{item\.reload\}\}/g, String(raw.reload ?? ""))
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDndItemProperties(
  property: unknown[] | undefined,
  indexes: ItemBaseIndexes,
  raw?: RawItemEntity,
): string | null {
  if (!Array.isArray(property) || property.length === 0) return null;

  const labels = property.map((entry) => {
    const uid = String(entry);
    return raw
      ? formatPropertyWithTemplate(uid, raw, indexes)
      : resolveItemPropertyLabel(uid, indexes);
  });

  return labels.length > 0 ? labels.join(", ") : null;
}

/**
 * Formats 5etools weapon `mastery` UIDs (e.g. `["Slow|XPHB"]`) for display.
 * Returns null when the item has no mastery (typical of 2014 PHB reprints).
 */
export function formatDndItemMastery(
  mastery: unknown[] | undefined,
): string | null {
  if (!Array.isArray(mastery) || mastery.length === 0) return null;

  const labels = mastery
    .map((entry) => parseMasteryUid(String(entry)).name)
    .filter(Boolean);

  return labels.length > 0 ? labels.join(", ") : null;
}

/**
 * Collects 5etools rule entries attached to an item (type text like Range,
 * each weapon property, mastery properties, and type-additional entries).
 * Order mirrors 5etools: type → properties → masteries → type-additional.
 */
export function collectDndItemAttachedRuleEntries(
  raw: RawItemEntity,
  indexes: ItemBaseIndexes,
): unknown[] {
  const out: unknown[] = [];

  const typeEntry = lookupTypeEntry(
    raw.type != null ? String(raw.type) : undefined,
    indexes,
  );
  if (Array.isArray(typeEntry?.entries)) {
    out.push(...typeEntry.entries);
  }

  if (Array.isArray(raw.property)) {
    for (const prop of raw.property) {
      const entry = lookupPropertyEntry(String(prop), indexes, raw.source);
      if (Array.isArray(entry?.entries)) {
        out.push(...entry.entries);
      }
    }
  }

  if (Array.isArray(raw.mastery)) {
    for (const masteryUid of raw.mastery) {
      const { name } = parseMasteryUid(String(masteryUid));
      const entry = lookupMasteryEntry(
        String(masteryUid),
        indexes,
        raw.source,
      );
      if (!name || !Array.isArray(entry?.entries) || entry.entries.length === 0) {
        continue;
      }
      out.push({
        type: "entries",
        name: `Mastery: ${name}`,
        entries: entry.entries,
      });
    }
  }

  const typeCode = raw.type != null ? String(raw.type) : undefined;
  if (typeCode) {
    const typeKey = typeCode.toLowerCase();
    const { abbreviation } = unpackItemTypeUid(typeCode);
    for (const extra of indexes.itemTypeAdditionalEntries) {
      const applies = extra.appliesTo.toLowerCase();
      if (
        applies === typeKey ||
        applies === abbreviation.toLowerCase() ||
        applies.startsWith(`${abbreviation.toLowerCase()}|`)
      ) {
        out.push(...extra.entries);
      }
    }
  }

  return out;
}
