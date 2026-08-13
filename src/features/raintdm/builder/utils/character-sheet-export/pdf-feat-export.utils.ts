import type { DndFeat } from "@/shared/types";
import { getAllDndFeats } from "@/features/dnd/feats/services/dnd-feat.service";
import { getAllDndOptionalFeatures } from "@/features/dnd/optionalfeatures/services/dnd-optionalfeature.service";
import type { OptionalFeatureDescMap } from "./pdf-class-features-export.utils";

const GENERIC_FEAT_INTRO = /^you gain the following benefits\.?$/i;

function stripFeatMarkup(line: string): string {
  return line.replace(/\*\*/g, "").replace(/^»\s*/, "").trim();
}

/** Collects lead paragraphs, subsections, and ASI lines for PDF export. */
export function collectFeatExportLines(
  feat: Pick<DndFeat, "paragraphs" | "sections" | "abilityIncreases">,
): string[] {
  const lines: string[] = [];

  if (feat.abilityIncreases.length > 0) {
    lines.push(feat.abilityIncreases.map((entry) => entry.label).join(", "));
  }

  for (const paragraph of feat.paragraphs) {
    const text = stripFeatMarkup(paragraph);
    if (text) lines.push(text);
  }

  for (const section of feat.sections) {
    if (section.name) {
      const name = stripFeatMarkup(section.name);
      if (name) lines.push(name);
    }
    for (const paragraph of section.paragraphs) {
      const text = stripFeatMarkup(paragraph);
      if (text) lines.push(text);
    }
  }

  return lines;
}

export function formatFeatExportBody(lines: string[]): string {
  const filtered = lines.map(stripFeatMarkup).filter(Boolean);
  if (filtered.length === 0) return "";

  const withoutIntro =
    filtered.length > 1 && GENERIC_FEAT_INTRO.test(filtered[0])
      ? filtered.slice(1)
      : filtered;

  return withoutIntro.join("\n");
}

export interface FeatExportDescLookup {
  byId: Map<string, string[]>;
  byName: Map<string, string[]>;
}

export function buildFeatExportDescLookup(feats: DndFeat[]): FeatExportDescLookup {
  const byId = new Map<string, string[]>();
  const byName = new Map<string, string[]>();

  for (const feat of feats) {
    const lines = collectFeatExportLines(feat);
    byId.set(feat.id, lines);
    if (!byName.has(feat.name.toLowerCase())) {
      byName.set(feat.name.toLowerCase(), lines);
    }
  }

  return { byId, byName };
}

export function formatFeatExportLine(
  featName: string,
  featId: string,
  suffix: string,
  lookup: FeatExportDescLookup,
): string {
  const lines =
    lookup.byId.get(featId) ??
    lookup.byName.get(featName.toLowerCase()) ??
    [];
  const headline = `${featName}${suffix}`;
  const body = formatFeatExportBody(lines);
  return body ? `${headline}\n${body}` : headline;
}

/** Description lookups needed by the character-sheet and Foundry exports. */
export interface FeatExportLookups {
  optDescMap: OptionalFeatureDescMap;
  featDescLookup: FeatExportDescLookup;
}

/**
 * Loads the full feat + optional-feature catalogs and builds the id→description
 * map (optional features) and feat description lookup used by both export paths.
 */
export async function loadFeatExportLookups(): Promise<FeatExportLookups> {
  const [allFeats, allOptFeatures] = await Promise.all([
    getAllDndFeats(),
    getAllDndOptionalFeatures(),
  ]);
  const optDescMap: OptionalFeatureDescMap = new Map(
    allOptFeatures.map((f) => [f.id, f.entries]),
  );
  const featDescLookup = buildFeatExportDescLookup(allFeats);
  return { optDescMap, featDescLookup };
}
