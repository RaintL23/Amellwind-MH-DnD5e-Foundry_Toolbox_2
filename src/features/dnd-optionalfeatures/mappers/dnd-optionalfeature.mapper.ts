import type {
  DndOptionalFeature,
  DndOptionalFeaturePrerequisite,
  OptionalFeatureFeatProgression,
  SubclassSpellBlock,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

function classId(name: string, source: string): string {
  return `${source}::${name}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

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
    } else if (Array.isArray(obj.entries)) {
      result.push(...renderEntries(obj.entries as unknown[]));
    }
  }

  return result;
}

function mapAdditionalSpells(raw: unknown): SubclassSpellBlock[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((block) => {
    const b = block as Raw;
    return {
      prepared: b.prepared as SubclassSpellBlock["prepared"],
      known: b.known as SubclassSpellBlock["known"],
      expanded: b.expanded as SubclassSpellBlock["expanded"],
    };
  });
}

function parsePrerequisiteEntry(raw: unknown): DndOptionalFeaturePrerequisite | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Raw;

  if (obj.level && typeof obj.level === "object") {
    const levelObj = obj.level as Raw;
    const minClassLevel =
      typeof levelObj.level === "number" ? levelObj.level : undefined;
    const className =
      typeof levelObj.class === "object" && levelObj.class
        ? String((levelObj.class as Raw).name ?? "")
        : "";
    const summary = className
      ? `${className} level ${minClassLevel ?? "?"}`
      : `Level ${minClassLevel ?? "?"}`;
    return {
      kind: "level",
      summary,
      minClassLevel,
    };
  }

  if (Array.isArray(obj.feature) && obj.feature.length) {
    const names = obj.feature.map(String);
    return {
      kind: "feature",
      summary: `Requires: ${names.join(", ")}`,
      requiredFeatures: names,
    };
  }

  if (typeof obj.pact === "string") {
    return {
      kind: "pact",
      summary: `Requires ${obj.pact}`,
      pactName: obj.pact,
    };
  }

  if (typeof obj.otherSummary === "object" && obj.otherSummary) {
    const entry = String((obj.otherSummary as Raw).entry ?? "").trim();
    if (entry) {
      return { kind: "other", summary: parseFiveToolsMarkup(entry) };
    }
  }

  if (typeof obj.spell === "object" && obj.spell) {
    const spell = obj.spell as Raw;
    const parts: string[] = [];
    if (Array.isArray(spell.ability)) {
      parts.push(`${spell.ability.join("/")} spell`);
    }
    if (typeof spell.level === "number") {
      parts.push(`level ${spell.level}+`);
    }
    return {
      kind: "other",
      summary: parts.length ? parts.join(", ") : "Spell prerequisite",
    };
  }

  return null;
}

function mapPrerequisites(raw: unknown): DndOptionalFeaturePrerequisite[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parsePrerequisiteEntry)
    .filter((p): p is DndOptionalFeaturePrerequisite => p !== null);
}

function mapFeatProgression(
  raw: unknown,
): OptionalFeatureFeatProgression[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const result: OptionalFeatureFeatProgression[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Raw;
    const categories = Array.isArray(obj.category)
      ? obj.category.map(String)
      : [];
    if (!categories.length) continue;

    let countPerSelection = 1;
    if (typeof obj.progression === "object" && obj.progression !== null) {
      const prog = obj.progression as Raw;
      if ("*" in prog) {
        countPerSelection = Number(prog["*"]) || 1;
      }
    }

    result.push({
      name: String(obj.name ?? "Origin Feat"),
      categories,
      countPerSelection,
    });
  }

  return result.length ? result : undefined;
}

function detectRepeatable(entries: string[]): boolean {
  return entries.some((line) => /\brepeatable\b/i.test(line));
}

function formatConsumes(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Raw;
    if (typeof obj.name === "string") return obj.name;
  }
  return undefined;
}

export function mapDndOptionalFeature(raw: Raw): DndOptionalFeature {
  const name = String(raw.name ?? "");
  const source = String(raw.source ?? "PHB");
  const entries = Array.isArray(raw.entries)
    ? renderEntries(raw.entries as unknown[])
    : [];

  return {
    id: classId(name, source),
    name,
    source,
    page: typeof raw.page === "number" ? raw.page : undefined,
    featureType: Array.isArray(raw.featureType)
      ? raw.featureType.map(String)
      : [],
    entries,
    prerequisites: mapPrerequisites(raw.prerequisite),
    additionalSpells: mapAdditionalSpells(raw.additionalSpells),
    featProgression: mapFeatProgression(raw.featProgression),
    isRepeatable: detectRepeatable(entries),
    consumes: formatConsumes(raw.consumes),
  };
}
