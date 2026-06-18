import type {
  FeatureChoiceOption,
  FeatureChoicePickMode,
  OptionalFeatureProgression,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  statBlockContentToPlainText,
} from "@/shared/utils/statblock-entries.mapper";
import { mapStatBlockEntries } from "@/shared/utils/statblock-entries.mapper";
import { classId } from "../mappers/class.mapper";
import type {
  RawClassFeature,
  RawSubclassFeature,
} from "./class-raw.types";
import {
  buildClassFeatureIndex,
  buildSubclassFeatureIndex,
} from "./class-processor.utils";
import {
  classFeatureKey,
  subclassFeatureKey,
  unpackClassFeatureUid,
  unpackSubclassFeatureUid,
} from "./class-uids.utils";
import { DEFAULT_CLASS_SOURCE } from "./class-raw.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export interface FeatureChoiceExtractionContext {
  classFeatureIndex: Map<string, RawClassFeature>;
  subclassFeatureIndex: Map<string, RawSubclassFeature>;
  /** Names of optionalFeatureProgression entries on the owner (skip catalog listings). */
  optionalProgressionNames: string[];
}

interface ParsedOptionsBlock {
  pickCount: number;
  pickMode: FeatureChoicePickMode;
  style?: string;
  refs: ParsedOptionRef[];
}

interface ParsedOptionRef {
  kind: "class" | "subclass" | "inline";
  uid?: string;
  name: string;
  source: string;
  rawEntries?: unknown[];
}

/** Table / prose choices without a 5etools {@code options} block. */
const MANUAL_FEATURE_CHOICES: Record<
  string,
  { pickCount: number; pickMode: FeatureChoicePickMode; options: FeatureChoiceOption[] }
> = {
  "the genie|warlock|genie|tce|1": {
    pickCount: 1,
    pickMode: "one",
    options: [
      {
        id: "genie-dao",
        name: "Dao",
        source: "TCE",
        entries: ["Earth genie patron (dao)."],
      },
      {
        id: "genie-djinni",
        name: "Djinni",
        source: "TCE",
        entries: ["Air genie patron (djinni)."],
      },
      {
        id: "genie-efreeti",
        name: "Efreeti",
        source: "TCE",
        entries: ["Fire genie patron (efreeti)."],
      },
      {
        id: "genie-marid",
        name: "Marid",
        source: "TCE",
        entries: ["Water genie patron (marid)."],
      },
    ],
  },
};

function featureChoiceKey(
  scope: "class" | "subclass",
  ownerId: string,
  featureName: string,
  level: number,
): string {
  const slug = featureName.replace(/[^a-zA-Z0-9+]/g, "_");
  const ownerSlug = ownerId.replace(/[^a-zA-Z0-9+]/g, "_");
  return `fc_${scope}_${ownerSlug}_${slug}_L${level}`;
}

function entriesToPlain(entries: unknown[] | undefined): string[] {
  if (!entries?.length) return [];
  const content = mapStatBlockEntries(entries);
  return content
    .map(statBlockContentToPlainText)
    .map((line) => line.trim())
    .filter(Boolean);
}

function collectProse(entries: unknown[] | undefined): string {
  if (!entries?.length) return "";
  const parts: string[] = [];
  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (typeof node === "string") parts.push(node);
      else if (typeof node === "object" && node !== null) {
        const obj = node as Raw;
        if (Array.isArray(obj.entries)) walk(obj.entries as unknown[]);
      }
    }
  };
  walk(entries);
  return parts.join(" ");
}

/** Prose on a single entries node (name + direct string children only). */
function collectLocalProse(node: Raw): string {
  const parts: string[] = [];
  if (typeof node.name === "string" && node.name.trim()) {
    parts.push(node.name);
  }
  if (!Array.isArray(node.entries)) return parts.join(" ");
  for (const entry of node.entries as unknown[]) {
    if (typeof entry === "string") parts.push(entry);
  }
  return parts.join(" ");
}

const INLINE_CHOICE_PROSE =
  /\b(?:choose one of the following(?: options)?|one of the following options|following feature options|choose one)\b/i;

function proseIndicatesFeatureChoice(prose: string): boolean {
  return INLINE_CHOICE_PROSE.test(prose);
}

function isCatalogListingBlock(
  block: ParsedOptionsBlock,
  featureName: string,
  ctx: FeatureChoiceExtractionContext,
): boolean {
  if (/ options$/i.test(featureName)) return true;
  if (
    ctx.optionalProgressionNames.some(
      (n) => n.toLowerCase() === featureName.toLowerCase(),
    )
  ) {
    return true;
  }
  return block.refs.length === 0;
}

function parseOptionsBlock(
  node: Raw,
  prose: string,
): ParsedOptionsBlock | null {
  if (node.type !== "options" || !Array.isArray(node.entries)) return null;

  const style = typeof node.style === "string" ? node.style : undefined;
  const refs: ParsedOptionRef[] = [];

  for (const entry of node.entries as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const obj = entry as Raw;

    if (obj.type === "refClassFeature" && typeof obj.classFeature === "string") {
      const u = unpackClassFeatureUid(obj.classFeature);
      refs.push({
        kind: "class",
        uid: obj.classFeature,
        name: u.name,
        source: u.source,
      });
      continue;
    }

    if (
      obj.type === "refSubclassFeature" &&
      typeof obj.subclassFeature === "string"
    ) {
      const u = unpackSubclassFeatureUid(obj.subclassFeature);
      refs.push({
        kind: "subclass",
        uid: obj.subclassFeature,
        name: u.name,
        source: u.source,
      });
      continue;
    }

    if (obj.type === "refOptionalfeature") {
      continue;
    }

    if (obj.type === "entries" && typeof obj.name === "string") {
      refs.push({
        kind: "inline",
        name: obj.name,
        source: "",
        uid: obj.name,
        rawEntries: Array.isArray(obj.entries)
          ? (obj.entries as unknown[])
          : undefined,
      });
    }
  }

  if (refs.length === 0) return null;

  const count =
    typeof node.count === "number" && node.count > 0 ? node.count : undefined;

  if (style === "list-hang-notitle") {
    return { pickCount: refs.length, pickMode: "all", style, refs };
  }

  if (count === 1) {
    return { pickCount: 1, pickMode: "one", style, refs };
  }

  if (/\bchoose\b/i.test(prose) && refs.every((r) => r.kind === "subclass")) {
    return { pickCount: 1, pickMode: "one", style, refs };
  }

  if (/\bchoose one\b/i.test(prose) || /\bchoose a\b/i.test(prose)) {
    return { pickCount: 1, pickMode: "one", style, refs };
  }

  if (count !== undefined && count > 1) {
    return null;
  }

  return { pickCount: refs.length, pickMode: "all", style, refs };
}

function findOptionsBlocks(
  entries: unknown[] | undefined,
): ParsedOptionsBlock[] {
  if (!entries?.length) return [];
  const prose = collectProse(entries);
  const blocks: ParsedOptionsBlock[] = [];

  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (typeof node !== "object" || node === null) continue;
      const obj = node as Raw;
      const parsed = parseOptionsBlock(obj, prose);
      if (parsed) blocks.push(parsed);
      if (Array.isArray(obj.entries)) walk(obj.entries as unknown[]);
    }
  };

  walk(entries);
  return blocks;
}

/** Named {@code entries} siblings when the parent block prose indicates a pick. */
function findInlineChoiceBlocks(
  entries: unknown[] | undefined,
): ParsedOptionsBlock[] {
  if (!entries?.length) return [];

  const blocks: ParsedOptionsBlock[] = [];

  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (typeof node !== "object" || node === null) continue;
      const obj = node as Raw;

      if (obj.type === "entries" && Array.isArray(obj.entries)) {
        const localProse = collectLocalProse(obj);
        const namedChildren = (obj.entries as Raw[]).filter(
          (child) =>
            child.type === "entries" &&
            typeof child.name === "string" &&
            child.name.length > 0,
        );
        if (
          namedChildren.length >= 2 &&
          proseIndicatesFeatureChoice(localProse)
        ) {
          blocks.push({
            pickCount: 1,
            pickMode: "one",
            refs: namedChildren.map((child) => ({
              kind: "inline" as const,
              name: String(child.name),
              source: "",
              rawEntries: Array.isArray(child.entries)
                ? (child.entries as unknown[])
                : undefined,
            })),
          });
        }
        walk(obj.entries as unknown[]);
        continue;
      }

      if (Array.isArray(obj.entries)) walk(obj.entries as unknown[]);
    }
  };

  walk(entries);
  return blocks;
}

function findAllChoiceBlocks(
  entries: unknown[] | undefined,
): ParsedOptionsBlock[] {
  const standard = findOptionsBlocks(entries);
  if (standard.length > 0) return standard;
  return findInlineChoiceBlocks(entries);
}

function resolveOptionRef(
  ref: ParsedOptionRef,
  ctx: FeatureChoiceExtractionContext,
): FeatureChoiceOption | null {
  if (ref.kind === "inline") {
    const entries = ref.rawEntries?.length
      ? entriesToPlain(ref.rawEntries)
      : [];
    return {
      id: `inline::${ref.name}`,
      name: ref.name,
      source: ref.source || "—",
      entries,
    };
  }

  if (ref.kind === "class" && ref.uid) {
    const u = unpackClassFeatureUid(ref.uid);
    const exactKey = classFeatureKey({
      name: u.name,
      className: u.className,
      classSource: u.classSource,
      level: u.level,
      source: u.source,
    });
    let feature = ctx.classFeatureIndex.get(exactKey);
    if (!feature) {
      for (const candidate of ctx.classFeatureIndex.values()) {
        if (
          candidate.name === u.name &&
          candidate.className === u.className &&
          candidate.level === u.level &&
          (candidate.classSource || DEFAULT_CLASS_SOURCE) === u.classSource
        ) {
          feature = candidate;
          break;
        }
      }
    }
    if (!feature) {
      return {
        id: `class::${ref.uid}`,
        name: ref.name,
        source: ref.source,
        entries: [],
      };
    }
    return {
      id: classId(feature.name, feature.source),
      name: feature.name,
      source: feature.source,
      entries: entriesToPlain(feature.entries),
    };
  }

  if (ref.kind === "subclass" && ref.uid) {
    const u = unpackSubclassFeatureUid(ref.uid);
    const feature = ctx.subclassFeatureIndex.get(
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
    if (!feature) {
      return {
        id: `subclass::${ref.uid}`,
        name: ref.name,
        source: ref.source,
        entries: [],
      };
    }
    return {
      id: classId(feature.name, feature.source),
      name: feature.name,
      source: feature.source,
      entries: entriesToPlain(feature.entries),
    };
  }

  return null;
}

function shouldSkipFeature(
  featureName: string,
  ctx: FeatureChoiceExtractionContext,
): boolean {
  const lower = featureName.toLowerCase();
  if (/ options$/i.test(featureName)) return true;
  if (lower === "eldritch invocations" || lower === "metamagic") return true;
  return ctx.optionalProgressionNames.some(
    (n) => n.toLowerCase() === lower || lower.includes(n.toLowerCase()),
  );
}

function manualChoiceForFeature(
  feature: RawClassFeature | RawSubclassFeature,
  subclassShortName?: string,
): (typeof MANUAL_FEATURE_CHOICES)[string] | null {
  const sc = subclassShortName ?? ("subclassShortName" in feature
    ? feature.subclassShortName
    : "");
  const key = `${feature.name}|${feature.className}|${sc}|${feature.source}|${feature.level}`.toLowerCase();
  return MANUAL_FEATURE_CHOICES[key] ?? null;
}

function blockToProgression(
  feature: RawClassFeature | RawSubclassFeature,
  block: ParsedOptionsBlock,
  scope: "class" | "subclass",
  ownerId: string,
  ctx: FeatureChoiceExtractionContext,
  blockIndex: number,
): OptionalFeatureProgression | null {
  if (isCatalogListingBlock(block, feature.name, ctx)) return null;

  const options = block.refs
    .map((ref) => resolveOptionRef(ref, ctx))
    .filter((o): o is FeatureChoiceOption => o !== null);

  if (options.length === 0) return null;

  const pickCount =
    block.pickMode === "one" ? 1 : Math.min(block.pickCount, options.length);

  const suffix = blockIndex > 0 ? `_${blockIndex}` : "";

  return {
    id: `${featureChoiceKey(scope, ownerId, feature.name, feature.level)}${suffix}`,
    name: feature.name,
    featureTypes: [],
    catalog: "feature-choice",
    pickMode: block.pickMode,
    choiceOptions: options,
    scope,
    ownerId,
    progression: { [String(feature.level)]: pickCount },
  };
}

export function extractFeatureChoiceProgressionsFromFeature(
  feature: RawClassFeature | RawSubclassFeature,
  scope: "class" | "subclass",
  ownerId: string,
  ctx: FeatureChoiceExtractionContext,
): OptionalFeatureProgression[] {
  if (shouldSkipFeature(feature.name, ctx)) return [];

  const results: OptionalFeatureProgression[] = [];

  const manual = manualChoiceForFeature(
    feature,
    "subclassShortName" in feature ? feature.subclassShortName : undefined,
  );
  if (manual) {
    results.push({
      id: featureChoiceKey(scope, ownerId, feature.name, feature.level),
      name: feature.name,
      featureTypes: [],
      catalog: "feature-choice",
      pickMode: manual.pickMode,
      choiceOptions: manual.options,
      scope,
      ownerId,
      progression: { [String(feature.level)]: manual.pickCount },
    });
    return results;
  }

  const blocks = findAllChoiceBlocks(feature.entries);
  blocks.forEach((block, i) => {
    const progression = blockToProgression(
      feature,
      block,
      scope,
      ownerId,
      ctx,
      i,
    );
    if (progression) results.push(progression);
  });

  return results;
}

function matchesClassFeature(
  feature: RawClassFeature,
  className: string,
  classSource: string,
): boolean {
  return (
    feature.className === className &&
    (feature.classSource || DEFAULT_CLASS_SOURCE) === classSource
  );
}

function matchesSubclassFeature(
  feature: RawSubclassFeature,
  className: string,
  classSource: string,
  subclassShortName: string,
  subclassSource: string,
): boolean {
  return (
    feature.className === className &&
    (feature.classSource || DEFAULT_CLASS_SOURCE) === classSource &&
    feature.subclassShortName === subclassShortName &&
    (feature.subclassSource || DEFAULT_CLASS_SOURCE) === subclassSource
  );
}

export function extractClassFeatureChoiceProgressions(
  className: string,
  classSource: string,
  classFeatures: RawClassFeature[],
  subclassFeatures: RawSubclassFeature[],
  optionalProgressionNames: string[],
): OptionalFeatureProgression[] {
  const classFeatureIndex = buildClassFeatureIndex(classFeatures);
  const subclassFeatureIndex = buildSubclassFeatureIndex(subclassFeatures);
  const ownerId = classId(className, classSource);
  const ctx: FeatureChoiceExtractionContext = {
    classFeatureIndex,
    subclassFeatureIndex,
    optionalProgressionNames,
  };

  const results: OptionalFeatureProgression[] = [];
  const seenIds = new Set<string>();

  for (const feature of classFeatures) {
    if (!matchesClassFeature(feature, className, classSource)) continue;

    for (const p of extractFeatureChoiceProgressionsFromFeature(
      feature,
      "class",
      ownerId,
      ctx,
    )) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      results.push(p);
    }
  }

  return results;
}

export function extractSubclassFeatureChoiceProgressions(
  subclassName: string,
  subclassSource: string,
  className: string,
  classSource: string,
  subclassShortName: string,
  classFeatures: RawClassFeature[],
  subclassFeatures: RawSubclassFeature[],
  optionalProgressionNames: string[],
): OptionalFeatureProgression[] {
  const classFeatureIndex = buildClassFeatureIndex(classFeatures);
  const subclassFeatureIndex = buildSubclassFeatureIndex(subclassFeatures);
  const ownerId = classId(subclassName, subclassSource);
  const ctx: FeatureChoiceExtractionContext = {
    classFeatureIndex,
    subclassFeatureIndex,
    optionalProgressionNames,
  };

  const results: OptionalFeatureProgression[] = [];
  const seenIds = new Set<string>();

  for (const feature of subclassFeatures) {
    if (
      !matchesSubclassFeature(
        feature,
        className,
        classSource,
        subclassShortName,
        subclassSource,
      )
    ) {
      continue;
    }

    for (const p of extractFeatureChoiceProgressionsFromFeature(
      feature,
      "subclass",
      ownerId,
      ctx,
    )) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      results.push(p);
    }
  }

  return results;
}

export function mergeFeatureChoiceProgressions(
  existing: OptionalFeatureProgression[] | undefined,
  extracted: OptionalFeatureProgression[],
): OptionalFeatureProgression[] {
  if (!extracted.length) return existing ?? [];
  const seen = new Set((existing ?? []).map((p) => p.id));
  const merged = [...(existing ?? [])];
  for (const p of extracted) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
  }
  return merged;
}

/** Human-readable label for prose-only strings in manual entries. */
export function formatFeatureChoiceProse(text: string): string {
  return parseFiveToolsMarkup(text);
}
