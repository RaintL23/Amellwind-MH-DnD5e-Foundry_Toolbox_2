import type {
  BackgroundProficiencies,
  BackgroundSection,
  BackgroundTable,
  DndBackground,
  DndBackgroundEdition,
  DndBackgroundFeatRef,
  AbilityBonus,
  AbilityKey,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { formatAbilitySummary } from "@/features/dnd-races/mappers/dnd-race.mapper";
import { parseOriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { parseSkillProficiencyBlocks } from "@/shared/utils/skill-proficiency.parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function backgroundId(raw: Raw): string {
  return `${raw.name}::${raw.source}`;
}

function inferEdition(raw: Raw): DndBackgroundEdition | undefined {
  if (raw.edition === "one") return "2024";
  if (raw.source === "XPHB") return "2024";
  return undefined;
}

function titleCase(skill: string): string {
  return skill
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatChoose(from: unknown[], amount = 1): string {
  const opts = from.map((s) => titleCase(String(s)));
  if (opts.length === 0) return "";
  const count = amount > 1 ? `${amount} from ` : "one from ";
  return `${count}${opts.join(", ")}`;
}

function mapProficiencyBlock(block: Raw): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(block)) {
    if (key === "choose" || key === "_") continue;
    if (value === true) parts.push(titleCase(key));
    if (key === "anyStandard" && typeof value === "number") {
      parts.push(
        `${value} standard language${value > 1 ? "s" : ""} of your choice`,
      );
    }
    if (key === "any" && typeof value === "number") {
      parts.push(`${value} language${value > 1 ? "s" : ""} of your choice`);
    }
  }
  const choose = block.choose as Raw | undefined;
  if (choose && Array.isArray(choose.from)) {
    const amount = typeof choose.count === "number" ? choose.count : 1;
    parts.push(formatChoose(choose.from as unknown[], amount));
  }
  const weighted = choose?.weighted as Raw | undefined;
  if (weighted && Array.isArray(weighted.from)) {
    parts.push(formatChoose(weighted.from as unknown[]));
  }
  return parts;
}

function mapSkillSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.skillProficiencies)
    ? (raw.skillProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap(mapProficiencyBlock);
  return parts.length ? parts.join("; ") : "—";
}

function mapToolSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.toolProficiencies)
    ? (raw.toolProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap(mapProficiencyBlock);
  return parts.length ? parts.join("; ") : "—";
}

function mapLanguageSummary(raw: Raw): string {
  const blocks = Array.isArray(raw.languageProficiencies)
    ? (raw.languageProficiencies as Raw[])
    : [];
  const parts = blocks.flatMap(mapProficiencyBlock);
  return parts.length ? parts.join("; ") : "—";
}

function formatWeightsLabel(weights: number[]): string {
  return weights.map((w) => `+${w}`).join("/");
}

function sameAbilitySet(a: AbilityKey[], b: AbilityKey[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function mapAbilityBonuses(ability: unknown): AbilityBonus[] {
  if (!Array.isArray(ability)) return [];

  const weightedBlocks: Array<{ from: AbilityKey[]; weights: number[] }> = [];
  const result: AbilityBonus[] = [];

  for (const block of ability) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;
    const choose = b.choose as Raw | undefined;

    if (choose?.weighted) {
      const weighted = choose.weighted as Raw;
      weightedBlocks.push({
        from: (Array.isArray(weighted.from) ? weighted.from : []).map(
          String,
        ) as AbilityKey[],
        weights: Array.isArray(weighted.weights)
          ? weighted.weights.map((weight) => Number(weight))
          : [],
      });
      continue;
    }

    if (choose && Array.isArray(choose.from)) {
      result.push({
        kind: "choose",
        from: choose.from.map(String) as AbilityKey[],
        amount: Number(choose.amount ?? 1),
        count: typeof choose.count === "number" ? choose.count : undefined,
      });
    }
  }

  if (weightedBlocks.length >= 2) {
    const from = weightedBlocks[0].from;
    if (
      from.length > 0 &&
      weightedBlocks.every((block) => sameAbilitySet(block.from, from))
    ) {
      return [
        {
          kind: "weightedDistribution",
          from,
          modes: weightedBlocks.map((block) => ({
            weights: block.weights,
            label: formatWeightsLabel(block.weights),
          })),
        },
      ];
    }
  }

  for (const block of weightedBlocks) {
    const plusTwoCount = block.weights.filter((weight) => weight === 2).length;
    const plusOneCount = block.weights.filter((weight) => weight === 1).length;
    result.push({
      kind: "choose",
      from: block.from,
      amount: 1,
      count: plusTwoCount > 0 ? plusTwoCount + plusOneCount : plusOneCount,
    });
  }

  return result;
}

function titleCaseFeatName(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseFeatKey(key: string): {
  name: string;
  source: string;
  qualifier?: string;
} {
  const pipe = key.lastIndexOf("|");
  if (pipe === -1) {
    return { name: titleCaseFeatName(key.trim()), source: "" };
  }
  const beforePipe = key.slice(0, pipe).trim();
  const source = key.slice(pipe + 1).trim().toUpperCase();
  const semi = beforePipe.indexOf(";");
  if (semi !== -1) {
    return {
      name: titleCaseFeatName(beforePipe.slice(0, semi).trim()),
      qualifier: titleCaseFeatName(beforePipe.slice(semi + 1).trim()),
      source,
    };
  }
  return { name: titleCaseFeatName(beforePipe), source };
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

function mapFeatRefs(raw: Raw): DndBackgroundFeatRef[] {
  const refs: DndBackgroundFeatRef[] = [];
  const seen = new Set<string>();

  if (Array.isArray(raw.feats)) {
    for (const block of raw.feats) {
      if (typeof block !== "object" || block === null) continue;
      for (const [key, val] of Object.entries(block as Raw)) {
        if (val !== true) continue;
        const ref = buildFeatRef(key);
        if (!seen.has(ref.id)) {
          seen.add(ref.id);
          refs.push(ref);
        }
      }
    }
  }

  return refs;
}

function mapFeatSummary(raw: Raw, refs: DndBackgroundFeatRef[]): string {
  if (refs.length) return refs.map((r) => r.displayLabel).join("; ");

  if (!Array.isArray(raw.feats)) return "";
  const parts: string[] = [];
  for (const block of raw.feats) {
    if (typeof block !== "object" || block === null) continue;
    for (const [key, val] of Object.entries(block as Raw)) {
      if (val === true) {
        parts.push(parseFiveToolsMarkup(`{@feat ${key}}`));
      }
    }
  }
  return parts.join("; ");
}

function parseFeatRefsFromMarkup(text: string): DndBackgroundFeatRef[] {
  const refs: DndBackgroundFeatRef[] = [];
  const seen = new Set<string>();
  const pattern = /\{@feat\s+([^|}]+)(?:\|([^|}]+))?(?:\|([^}]+))?\}/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const name = titleCaseFeatName(match[1].trim());
    const source = (match[2] ?? match[3] ?? "").trim().toUpperCase();
    if (!source) continue;
    const ref: DndBackgroundFeatRef = {
      id: `${name}::${source}`,
      name,
      source,
      displayLabel: name,
    };
    if (!seen.has(ref.id)) {
      seen.add(ref.id);
      refs.push(ref);
    }
  }

  return refs;
}

function mapTable(raw: Raw): BackgroundTable {
  const colLabels = Array.isArray(raw.colLabels)
    ? raw.colLabels.map(String)
    : [];
  const rows = Array.isArray(raw.rows)
    ? (raw.rows as unknown[][]).map((row) =>
        row.map((cell) =>
          typeof cell === "string"
            ? parseFiveToolsMarkup(cell)
            : String(cell ?? ""),
        ),
      )
    : [];

  let rollKind: BackgroundTable["rollKind"] = "other";
  const label = colLabels[1]?.toLowerCase() ?? "";
  if (label.includes("personality")) rollKind = "personality";
  else if (label.includes("ideal")) rollKind = "ideal";
  else if (label.includes("bond")) rollKind = "bond";
  else if (label.includes("flaw")) rollKind = "flaw";

  return {
    caption: typeof raw.caption === "string" ? raw.caption : undefined,
    colLabels,
    rows,
    rollKind,
  };
}

function collectSectionContent(entries: unknown[]): {
  texts: string[];
  tables: BackgroundTable[];
} {
  const texts: string[] = [];
  const tables: BackgroundTable[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      texts.push(parseFiveToolsMarkup(entry));
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    if (e.type === "table") {
      tables.push(mapTable(e));
      continue;
    }
    if (Array.isArray(e.entries)) {
      const nested = collectSectionContent(e.entries as unknown[]);
      texts.push(...nested.texts);
      tables.push(...nested.tables);
    }
  }

  return { texts, tables };
}

function mapSections(entries: unknown[]): BackgroundSection[] {
  if (!Array.isArray(entries)) return [];
  const sections: BackgroundSection[] = [];

  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    const name = String(e.name ?? "").trim();
    if (!name) continue;

    const isFeature = Boolean(e.data?.isFeature);
    if (!isFeature && e.type !== "entries") continue;

    const { texts, tables } = collectSectionContent(
      Array.isArray(e.entries) ? (e.entries as unknown[]) : [],
    );
    sections.push({
      name,
      entries: texts,
      tables: tables.length ? tables : undefined,
    });
  }

  return sections;
}

function mapListProficiencies(entries: unknown[]): BackgroundProficiencies {
  const empty: BackgroundProficiencies = {
    skills: "—",
    tools: "—",
    languages: "—",
    equipment: "—",
  };

  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    if (e.type !== "list" || !Array.isArray(e.items)) continue;

    for (const item of e.items as Raw[]) {
      if (item.type !== "item" || !item.name) continue;
      const key = String(item.name).toLowerCase();
      const text =
        typeof item.entry === "string"
          ? parseFiveToolsMarkup(item.entry)
          : "—";
      if (key.includes("skill")) empty.skills = text;
      else if (key.includes("tool")) empty.tools = text;
      else if (key.includes("language")) empty.languages = text;
      else if (key.includes("equipment")) empty.equipment = text;
    }
  }

  return empty;
}

function mapFluff(fluff: unknown): string {
  if (typeof fluff !== "object" || fluff === null) return "";
  const f = fluff as Raw;
  if (!Array.isArray(f.entries)) return "";
  return f.entries
    .map((e: unknown) => {
      if (typeof e === "string") return parseFiveToolsMarkup(e);
      if (typeof e === "object" && e !== null) {
        const obj = e as Raw;
        if (Array.isArray(obj.entries)) {
          return collectSectionContent(obj.entries as unknown[]).texts.join(" ");
        }
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function splitEntries(raw: Raw): {
  listEntries: unknown[];
  features: BackgroundSection[];
  suggested: BackgroundSection[];
} {
  const all = Array.isArray(raw.entries) ? (raw.entries as unknown[]) : [];
  const listEntries: unknown[] = [];
  const featureEntries: unknown[] = [];
  const suggestedEntries: unknown[] = [];

  for (const entry of all) {
    if (typeof entry !== "object" || entry === null) {
      listEntries.push(entry);
      continue;
    }
    const e = entry as Raw;
    if (e.type === "list") {
      listEntries.push(entry);
      continue;
    }
    const name = String(e.name ?? "");
    if (/suggested characteristics/i.test(name)) {
      suggestedEntries.push(entry);
    } else if (e.data?.isFeature || /^feature:/i.test(name)) {
      featureEntries.push(entry);
    }
  }

  return {
    listEntries,
    features: mapSections(featureEntries),
    suggested: mapSections(suggestedEntries),
  };
}

function extractListField(listEntries: unknown[], field: string): string {
  for (const entry of listEntries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    if (e.type !== "list" || !Array.isArray(e.items)) continue;
    for (const item of e.items as Raw[]) {
      if (item.type !== "item" || !item.name) continue;
      if (String(item.name).toLowerCase().includes(field)) {
        return typeof item.entry === "string"
          ? parseFiveToolsMarkup(item.entry)
          : "";
      }
    }
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDndBackground(raw: any): DndBackground {
  const { listEntries, features, suggested } = splitEntries(raw);
  const listProf = mapListProficiencies(listEntries);
  const abilityBonuses = mapAbilityBonuses(raw.ability);
  const abilityFromList = extractListField(listEntries, "ability");
  const featFromList = extractListField(listEntries, "feat");
  const featRefsFromRaw = mapFeatRefs(raw);
  const featRefsFromList = featFromList
    ? parseFeatRefsFromMarkup(featFromList)
    : [];
  const featRefs = featRefsFromRaw.length
    ? featRefsFromRaw
    : featRefsFromList.length
      ? featRefsFromList
      : undefined;
  const abilitySummary =
    abilityFromList ||
    (abilityBonuses.length ? formatAbilitySummary(abilityBonuses) : undefined);
  const featSummary =
    featFromList ||
    mapFeatSummary(raw, featRefsFromRaw) ||
    undefined;

  const languages =
    listProf.languages !== "—"
      ? listProf.languages
      : mapLanguageSummary(raw);

  const skillGrants = parseSkillProficiencyBlocks(
    Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
    { type: "background", name: String(raw.name ?? "Unknown") },
  );

  return {
    id: backgroundId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "PHB"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    edition: inferEdition(raw),
    srd: raw.srd === true,
    basicRules: raw.basicRules === true,
    fluff: mapFluff(raw.fluff),
    proficiencies: {
      skills:
        listProf.skills !== "—" ? listProf.skills : mapSkillSummary(raw),
      tools: listProf.tools !== "—" ? listProf.tools : mapToolSummary(raw),
      languages: languages !== "—" ? languages : "—",
      equipment: listProf.equipment,
    },
    abilityBonuses,
    abilitySummary: abilitySummary || undefined,
    featSummary,
    featRefs,
    originFeatGrant: parseOriginFeatGrant(raw.feats),
    features,
    suggestedCharacteristics: suggested,
    skillGrants,
  };
}
