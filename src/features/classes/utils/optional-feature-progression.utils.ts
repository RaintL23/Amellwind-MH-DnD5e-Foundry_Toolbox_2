import type {
  DndOptionalFeatureRef,
  OptionalFeatureProgression,
} from "@/shared/types";
import type {
  RawClassFeatProgression,
  RawOptionalFeatureProgression,
} from "./class-raw.types";

function classId(name: string, source: string): string {
  return `${source}::${name}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseOptionalFeatureRef(raw: string): DndOptionalFeatureRef {
  const trimmed = raw.trim();
  const pipe = trimmed.indexOf("|");
  if (pipe === -1) {
    return { name: trimmed, source: "PHB" };
  }
  return {
    name: trimmed.slice(0, pipe).trim(),
    source: trimmed.slice(pipe + 1).trim() || "PHB",
  };
}

export const parseFeatRef = parseOptionalFeatureRef;

export function isFightingStyleCategory(category: string): boolean {
  const upper = category.toUpperCase();
  return upper === "FS" || upper.startsWith("FS:");
}

export function isFightingStyleProgression(
  progression: OptionalFeatureProgression,
): boolean {
  if (progression.catalog === "feat") return true;
  if (progression.featCategories?.some(isFightingStyleCategory)) return true;
  if (progression.featureTypes.some(isFightingStyleCategory)) return true;
  return /fighting style/i.test(progression.name);
}

export function optionalFeatureRefKey(ref: DndOptionalFeatureRef): string {
  return `${ref.name}|${ref.source}`.toLowerCase();
}

export function buildProgressionId(
  scope: "class" | "subclass",
  ownerId: string,
  featureTypes: string[],
): string {
  const typeSlug = featureTypes.join("+").replace(/[^a-zA-Z0-9+]/g, "");
  const ownerSlug = ownerId.replace(/[^a-zA-Z0-9+]/g, "_");
  return `${scope}_${ownerSlug}_${typeSlug}`;
}

export function mapOptionalFeatureProgressions(
  rawList: RawOptionalFeatureProgression[] | undefined,
  scope: "class" | "subclass",
  ownerName: string,
  ownerSource: string,
): OptionalFeatureProgression[] {
  if (!rawList?.length) return [];

  const ownerId = classId(ownerName, ownerSource);

  return rawList
    .filter((entry) => entry.featureType?.length && entry.progression)
    .map((entry) => {
      const featureTypes = entry.featureType!.map(String);
      return {
        id: buildProgressionId(scope, ownerId, featureTypes),
        name: entry.name,
        featureTypes,
        catalog: "optionalfeature",
        scope,
        ownerId,
        progression: entry.progression!,
      };
    });
}

export function mapClassFeatProgressions(
  rawList: RawClassFeatProgression[] | undefined,
  scope: "class" | "subclass",
  ownerName: string,
  ownerSource: string,
): OptionalFeatureProgression[] {
  if (!rawList?.length) return [];

  const ownerId = classId(ownerName, ownerSource);

  return rawList
    .filter(
      (entry) =>
        entry.category?.some(isFightingStyleCategory) && entry.progression,
    )
    .map((entry) => {
      const featCategories = entry.category!.filter(isFightingStyleCategory);
      return {
        id: buildProgressionId(scope, ownerId, featCategories),
        name: entry.name,
        featureTypes: [],
        catalog: "feat",
        featCategories,
        scope,
        ownerId,
        progression: entry.progression!,
      };
    });
}

export function mergeOptionalFeatureProgressions(
  optionalRaw: RawOptionalFeatureProgression[] | undefined,
  featRaw: RawClassFeatProgression[] | undefined,
  scope: "class" | "subclass",
  ownerName: string,
  ownerSource: string,
): OptionalFeatureProgression[] {
  return [
    ...mapOptionalFeatureProgressions(optionalRaw, scope, ownerName, ownerSource),
    ...mapClassFeatProgressions(featRaw, scope, ownerName, ownerSource),
  ];
}

/**
 * Total optional-feature picks allowed at a given character level.
 * - Array progression: value at index (level - 1).
 * - Object progression: max value among keys <= level (cumulative totals at breakpoints).
 */
export function getOptionalFeatureCountAtLevel(
  progression: number[] | Record<string, number> | undefined,
  level: number,
): number {
  if (!progression || level < 1) return 0;

  if (Array.isArray(progression)) {
    const idx = Math.min(level - 1, progression.length - 1);
    return progression[idx] ?? 0;
  }

  let max = 0;
  for (const [key, value] of Object.entries(progression)) {
    const breakpoint = parseInt(key, 10);
    if (!Number.isNaN(breakpoint) && breakpoint <= level && value > max) {
      max = value;
    }
  }
  return max;
}

/** Collect {@code refOptionalfeature} refs from {@code options} blocks only. */
export function extractOptionalFeatureRefs(
  entries: unknown[] | undefined,
): DndOptionalFeatureRef[] {
  if (!entries?.length) return [];

  const refs: DndOptionalFeatureRef[] = [];
  const seen = new Set<string>();

  const walk = (nodes: unknown[], insideOptionsBlock: boolean) => {
    for (const node of nodes) {
      if (typeof node !== "object" || node === null) continue;
      const obj = node as Raw;

      if (obj.type === "options" && Array.isArray(obj.entries)) {
        walk(obj.entries as unknown[], true);
        continue;
      }

      if (
        insideOptionsBlock &&
        obj.type === "refOptionalfeature" &&
        typeof obj.optionalfeature === "string"
      ) {
        const ref = parseOptionalFeatureRef(obj.optionalfeature);
        const key = optionalFeatureRefKey(ref);
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(ref);
        }
      }

      if (Array.isArray(obj.entries)) {
        walk(obj.entries as unknown[], insideOptionsBlock);
      }
    }
  };

  walk(entries, false);
  return refs;
}

/** Collect {@code refFeat} refs from {@code options} blocks only. */
export function extractFeatRefs(
  entries: unknown[] | undefined,
): DndOptionalFeatureRef[] {
  if (!entries?.length) return [];

  const refs: DndOptionalFeatureRef[] = [];
  const seen = new Set<string>();

  const walk = (nodes: unknown[], insideOptionsBlock: boolean) => {
    for (const node of nodes) {
      if (typeof node !== "object" || node === null) continue;
      const obj = node as Raw;

      if (obj.type === "options" && Array.isArray(obj.entries)) {
        walk(obj.entries as unknown[], true);
        continue;
      }

      if (
        insideOptionsBlock &&
        obj.type === "refFeat" &&
        typeof obj.feat === "string"
      ) {
        const ref = parseFeatRef(obj.feat);
        const key = optionalFeatureRefKey(ref);
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(ref);
        }
      }

      if (Array.isArray(obj.entries)) {
        walk(obj.entries as unknown[], insideOptionsBlock);
      }
    }
  };

  walk(entries, false);
  return refs;
}

export function resolveProgressionRaw(
  progressions: RawOptionalFeatureProgression[] | undefined,
  featureTypes: string[],
): number[] | Record<string, number> | undefined {
  if (!progressions?.length) return undefined;
  const match = progressions.find((p) =>
    p.featureType?.some((t) => featureTypes.includes(String(t))),
  );
  return match?.progression;
}
