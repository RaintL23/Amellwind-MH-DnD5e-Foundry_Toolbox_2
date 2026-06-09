import {
  Background,
  BackgroundFaction,
  BackgroundProficiencies,
  BackgroundSection,
  BackgroundTable,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { parseSkillProficiencyBlocks } from "@/shared/utils/skill-proficiency.parser";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function backgroundId(raw: Raw): string {
  return `${raw.name}::${raw.source}`;
}

function inferFaction(name: string): BackgroundFaction {
  const n = name.toLowerCase();
  if (n.includes("wycademy")) return "wycademy";
  if (n.includes("handler")) return "handlers-guild";
  return "hunters-guild";
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
  }
  const choose = block.choose as Raw | undefined;
  if (choose && Array.isArray(choose.from)) {
    const amount = typeof choose.count === "number" ? choose.count : 1;
    parts.push(formatChoose(choose.from as unknown[], amount));
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
    .filter((e: unknown) => typeof e === "string")
    .map((e: string) => parseFiveToolsMarkup(e))
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackground(raw: any): Background {
  const { listEntries, features, suggested } = splitEntries(raw);
  const listProf = mapListProficiencies(listEntries);

  const bgSource = { type: "background" as const, name: String(raw.name ?? "Unknown") };
  const skillGrants = parseSkillProficiencyBlocks(
    Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
    bgSource,
  );
  const toolGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.toolProficiencies) ? raw.toolProficiencies : [],
    bgSource,
  );
  const languageGrants = parseNamedProficiencyBlocks(
    Array.isArray(raw.languageProficiencies) ? raw.languageProficiencies : [],
    bgSource,
  );

  return {
    id: backgroundId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    faction: inferFaction(String(raw.name ?? "")),
    fluff: mapFluff(raw.fluff),
    proficiencies: {
      skills: listProf.skills !== "—" ? listProf.skills : mapSkillSummary(raw),
      tools: listProf.tools !== "—" ? listProf.tools : mapToolSummary(raw),
      languages: listProf.languages,
      equipment: listProf.equipment,
    },
    features,
    suggestedCharacteristics: suggested,
    skillGrants,
    toolGrants,
    languageGrants,
  };
}
