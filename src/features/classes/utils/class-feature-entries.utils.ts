import type { RawClassFeature } from "./class-raw.types";
import {
  classFeatureKey,
  unpackClassFeatureUid,
} from "./class-uids.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function lookupClassFeature(
  index: Map<string, RawClassFeature>,
  uid: string,
): RawClassFeature | undefined {
  const u = unpackClassFeatureUid(uid);
  if (Number.isNaN(u.level)) return undefined;
  return index.get(
    classFeatureKey({
      name: u.name,
      className: u.className,
      classSource: u.classSource,
      level: u.level,
      source: u.source,
    }),
  );
}

function isRefClassFeature(entry: unknown): entry is {
  type: "refClassFeature";
  classFeature: string;
} {
  return (
    typeof entry === "object" &&
    entry !== null &&
    (entry as Raw).type === "refClassFeature" &&
    typeof (entry as Raw).classFeature === "string"
  );
}

function entriesToPlainStrings(entries: unknown[]): string[] {
  const lines: string[] = [];
  for (const entry of entries) {
    if (typeof entry === "string") {
      lines.push(entry);
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;
    const obj = entry as Raw;
    if (obj.type === "list" && Array.isArray(obj.items)) {
      for (const item of obj.items as unknown[]) {
        if (typeof item === "string") lines.push(item);
      }
      continue;
    }
    if (Array.isArray(obj.entries)) {
      lines.push(...entriesToPlainStrings(obj.entries as unknown[]));
    }
  }
  return lines;
}

function refFeatureToListItem(
  uid: string,
  index: Map<string, RawClassFeature>,
): string | null {
  const feature = lookupClassFeature(index, uid);
  if (!feature?.entries?.length) return null;
  const resolved = resolveFeatureEntries(feature.entries, index);
  const text = entriesToPlainStrings(resolved).join(" ").trim();
  return text || null;
}

/**
 * Resolves inline {@code refClassFeature} references and normalizes nested
 * entry blocks so lists/paragraphs map correctly for display.
 */
export function resolveFeatureEntries(
  entries: unknown[],
  featureIndex: Map<string, RawClassFeature>,
): unknown[] {
  const result: unknown[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      result.push(entry);
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;

    const obj: Raw = entry as Raw;

    if (isRefClassFeature(obj)) {
      const text = refFeatureToListItem(obj.classFeature as string, featureIndex);
      if (text) result.push(text);
      continue;
    }

    if (obj.type === "list" && Array.isArray(obj.items)) {
      result.push({
        ...obj,
        items: resolveFeatureEntries(obj.items as unknown[], featureIndex),
      });
      continue;
    }

    if (obj.type === "entries" && Array.isArray(obj.entries)) {
      const inner = obj.entries as unknown[];

      if (inner.length > 0 && inner.every(isRefClassFeature)) {
        const items = inner
          .map((ref) =>
            refFeatureToListItem((ref as Raw).classFeature as string, featureIndex),
          )
          .filter((text): text is string => Boolean(text));
        if (items.length > 0) {
          result.push({ type: "list", items });
          continue;
        }
      }

      const resolvedInner = resolveFeatureEntries(inner, featureIndex);
      if (typeof obj.name === "string" && obj.name.trim()) {
        result.push({ ...obj, entries: resolvedInner });
      } else {
        result.push(...resolvedInner);
      }
      continue;
    }

    if (Array.isArray(obj.entries)) {
      result.push({
        ...obj,
        entries: resolveFeatureEntries(obj.entries as unknown[], featureIndex),
      });
      continue;
    }

    result.push(entry);
  }

  return result;
}
