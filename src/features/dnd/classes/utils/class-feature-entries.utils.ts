import type { RawClassFeature, RawSubclassFeature } from "./class-raw.types";
import {
  classFeatureKey,
  subclassFeatureKey,
  unpackClassFeatureUid,
  unpackSubclassFeatureUid,
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

function isRefSubclassFeature(entry: unknown): entry is {
  type: "refSubclassFeature";
  subclassFeature: string;
} {
  return (
    typeof entry === "object" &&
    entry !== null &&
    (entry as Raw).type === "refSubclassFeature" &&
    typeof (entry as Raw).subclassFeature === "string"
  );
}

function lookupSubclassFeature(
  index: Map<string, RawSubclassFeature>,
  uid: string,
): RawSubclassFeature | undefined {
  const u = unpackSubclassFeatureUid(uid);
  if (Number.isNaN(u.level)) return undefined;
  return index.get(
    subclassFeatureKey({
      name: u.name,
      className: u.className,
      classSource: u.classSource,
      subclassShortName: u.subclassShortName,
      subclassSource: u.subclassSource,
      level: u.level,
      source: u.source,
    }),
  );
}

export interface ResolveFeatureEntriesOptions {
  subclassFeatureIndex?: Map<string, RawSubclassFeature>;
  /** Omit refs that are promoted to sibling features during subclass processing. */
  skipRefSubclassFeature?: boolean;
}

/** Direct {@code refSubclassFeature} refs listed in a feature's top-level entries. */
export function collectDirectRefSubclassFeatureUids(entries: unknown[]): string[] {
  const uids: string[] = [];
  for (const entry of entries) {
    if (isRefSubclassFeature(entry)) {
      uids.push(entry.subclassFeature);
    }
  }
  return uids;
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
  options: ResolveFeatureEntriesOptions = {},
): string | null {
  const feature = lookupClassFeature(index, uid);
  if (!feature?.entries?.length) return null;
  const resolved = resolveFeatureEntries(feature.entries, index, options);
  const text = entriesToPlainStrings(resolved).join(" ").trim();
  return text || null;
}

function refSubclassFeatureToEntryBlock(
  uid: string,
  classFeatureIndex: Map<string, RawClassFeature>,
  subclassFeatureIndex: Map<string, RawSubclassFeature>,
): Raw | null {
  const feature = lookupSubclassFeature(subclassFeatureIndex, uid);
  if (!feature?.entries?.length) return null;
  const resolved = resolveFeatureEntries(feature.entries, classFeatureIndex, {
    subclassFeatureIndex,
  });
  return {
    type: "entries",
    name: feature.name,
    entries: resolved,
  };
}

/**
 * Resolves inline {@code refClassFeature} references and normalizes nested
 * entry blocks so lists/paragraphs map correctly for display.
 */
export function resolveFeatureEntries(
  entries: unknown[],
  featureIndex: Map<string, RawClassFeature>,
  options: ResolveFeatureEntriesOptions = {},
): unknown[] {
  const result: unknown[] = [];
  const { subclassFeatureIndex, skipRefSubclassFeature = false } = options;

  for (const entry of entries) {
    if (typeof entry === "string") {
      result.push(entry);
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;

    const obj: Raw = entry as Raw;

    if (isRefClassFeature(obj)) {
      const text = refFeatureToListItem(
        obj.classFeature as string,
        featureIndex,
        options,
      );
      if (text) result.push(text);
      continue;
    }

    if (isRefSubclassFeature(obj)) {
      if (skipRefSubclassFeature) continue;
      if (subclassFeatureIndex) {
        const block = refSubclassFeatureToEntryBlock(
          obj.subclassFeature as string,
          featureIndex,
          subclassFeatureIndex,
        );
        if (block) result.push(block);
      }
      continue;
    }

    if (obj.type === "list" && Array.isArray(obj.items)) {
      result.push({
        ...obj,
        items: resolveFeatureEntries(obj.items as unknown[], featureIndex, options),
      });
      continue;
    }

    if (obj.type === "entries" && Array.isArray(obj.entries)) {
      const inner = obj.entries as unknown[];

      if (inner.length > 0 && inner.every(isRefClassFeature)) {
        const items = inner
          .map((ref) =>
            refFeatureToListItem((ref as Raw).classFeature as string, featureIndex, options),
          )
          .filter((text): text is string => Boolean(text));
        if (items.length > 0) {
          result.push({ type: "list", items });
          continue;
        }
      }

      if (
        inner.length > 0 &&
        inner.every(isRefSubclassFeature) &&
        subclassFeatureIndex &&
        !skipRefSubclassFeature
      ) {
        const blocks = inner
          .map((ref) =>
            refSubclassFeatureToEntryBlock(
              (ref as Raw).subclassFeature as string,
              featureIndex,
              subclassFeatureIndex,
            ),
          )
          .filter((block): block is Raw => block !== null);
        if (blocks.length > 0) {
          if (typeof obj.name === "string" && obj.name.trim()) {
            result.push({ ...obj, entries: blocks });
          } else {
            result.push(...blocks);
          }
          continue;
        }
      }

      const resolvedInner = resolveFeatureEntries(inner, featureIndex, options);
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
        entries: resolveFeatureEntries(obj.entries as unknown[], featureIndex, options),
      });
      continue;
    }

    result.push(entry);
  }

  return result;
}
