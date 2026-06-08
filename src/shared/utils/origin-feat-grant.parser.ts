import type { DndBackgroundFeatRef } from "@/shared/types/dnd-feat.types";
import { parseFiveToolsMarkup } from "./fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export type OriginFeatGrant =
  | {
      kind: "fixed";
      featRefs: DndBackgroundFeatRef[];
      summary: string;
    }
  | {
      kind: "choose";
      categories: string[];
      count: number;
      summary: string;
    };

function titleCaseFeatName(raw: string): string {
  return raw
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseFeatKey(key: string): {
  name: string;
  source: string;
  qualifier?: string;
} {
  const pipe = key.lastIndexOf("|");
  const beforePipe = pipe === -1 ? key.trim() : key.slice(0, pipe).trim();
  const source = (pipe === -1 ? "" : key.slice(pipe + 1)).trim().toUpperCase();
  const semi = beforePipe.indexOf(";");
  if (semi !== -1) {
    return {
      name: titleCaseFeatName(beforePipe.slice(0, semi).trim()),
      qualifier: titleCaseFeatName(beforePipe.slice(semi + 1).trim()),
      source,
    };
  }
  const qualifierMatch = beforePipe.match(/\(([^)]+)\)\s*$/);
  const qualifier = qualifierMatch?.[1];
  const name = qualifier
    ? titleCaseFeatName(beforePipe.slice(0, qualifierMatch!.index).trim())
    : titleCaseFeatName(beforePipe);
  return { name, source, qualifier };
}

function buildFeatRef(key: string): DndBackgroundFeatRef {
  const parsed = parseFeatKey(key);
  const displayLabel = parsed.qualifier
    ? `${parsed.name} (${parsed.qualifier})`
    : parsed.name;
  return {
    id: `${parsed.name}::${parsed.source}`,
    name: parsed.name,
    source: parsed.source,
    qualifier: parsed.qualifier,
    displayLabel,
  };
}

function mapFixedFeatRefs(block: Raw): DndBackgroundFeatRef[] {
  const refs: DndBackgroundFeatRef[] = [];
  const seen = new Set<string>();

  for (const [key, val] of Object.entries(block)) {
    if (val !== true) continue;
    const ref = buildFeatRef(key);
    if (!seen.has(ref.id)) {
      seen.add(ref.id);
      refs.push(ref);
    }
  }

  return refs;
}

function categorySummary(categories: string[]): string {
  if (categories.includes("O")) return "Origin Feat of your choice";
  return `Feat (${categories.join(", ")}) of your choice`;
}

/** Parse 5etools `feats` blocks on races / backgrounds into a builder grant. */
export function parseOriginFeatGrant(feats: unknown): OriginFeatGrant | null {
  if (!Array.isArray(feats) || !feats.length) return null;

  const fixedRefs: DndBackgroundFeatRef[] = [];
  const seen = new Set<string>();
  let chooseGrant: Extract<OriginFeatGrant, { kind: "choose" }> | null = null;

  for (const block of feats) {
    if (typeof block !== "object" || block === null) continue;
    const raw = block as Raw;

    if (raw.anyFromCategory) {
      const afc = raw.anyFromCategory as Raw;
      const categories = Array.isArray(afc.category)
        ? afc.category.map(String)
        : [];
      const count = Number(afc.count ?? 1);
      if (categories.length) {
        chooseGrant = {
          kind: "choose",
          categories,
          count,
          summary: categorySummary(categories),
        };
      }
      continue;
    }

    for (const ref of mapFixedFeatRefs(raw)) {
      if (!seen.has(ref.id)) {
        seen.add(ref.id);
        fixedRefs.push(ref);
      }
    }
  }

  if (chooseGrant) return chooseGrant;

  if (fixedRefs.length) {
    return {
      kind: "fixed",
      featRefs: fixedRefs,
      summary: fixedRefs.map((r) => r.displayLabel).join("; "),
    };
  }

  const summaryParts: string[] = [];
  for (const block of feats) {
    if (typeof block !== "object" || block === null) continue;
    for (const [key, val] of Object.entries(block as Raw)) {
      if (val === true) {
        summaryParts.push(parseFiveToolsMarkup(`{@feat ${key}}`));
      }
    }
  }

  if (summaryParts.length) {
    return {
      kind: "fixed",
      featRefs: fixedRefs,
      summary: summaryParts.join("; "),
    };
  }

  return null;
}
