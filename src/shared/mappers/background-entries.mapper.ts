import type {
  BackgroundProficiencies,
  BackgroundSection,
  BackgroundTable,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { titleCase as titleCaseWords } from "@/shared/utils/string.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function titleCase(skill: string): string {
  return titleCaseWords(skill);
}

export function formatChoose(from: unknown[], amount = 1): string {
  const opts = from.map((s) => titleCase(String(s)));
  if (opts.length === 0) return "";
  const count = amount > 1 ? `${amount} from ` : "one from ";
  return `${count}${opts.join(", ")}`;
}

export interface MapProficiencyBlockOptions {
  /** Include D&D 2024 language/weighted choose fields. */
  extended?: boolean;
}

export function mapProficiencyBlock(
  block: Raw,
  options: MapProficiencyBlockOptions = {},
): string[] {
  const { extended = false } = options;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(block)) {
    if (key === "choose" || key === "_") continue;
    if (value === true) parts.push(titleCase(key));
    if (extended) {
      if (key === "anyStandard" && typeof value === "number") {
        parts.push(
          `${value} standard language${value > 1 ? "s" : ""} of your choice`,
        );
      }
      if (key === "any" && typeof value === "number") {
        parts.push(`${value} language${value > 1 ? "s" : ""} of your choice`);
      }
    }
  }
  const choose = block.choose as Raw | undefined;
  if (choose && Array.isArray(choose.from)) {
    const amount = typeof choose.count === "number" ? choose.count : 1;
    parts.push(formatChoose(choose.from as unknown[], amount));
  }
  if (extended) {
    const weighted = choose?.weighted as Raw | undefined;
    if (weighted && Array.isArray(weighted.from)) {
      parts.push(formatChoose(weighted.from as unknown[]));
    }
  }
  return parts;
}

export function mapBackgroundTable(raw: Raw): BackgroundTable {
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

export function collectSectionContent(entries: unknown[]): {
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
      tables.push(mapBackgroundTable(e));
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

export function mapSections(entries: unknown[]): BackgroundSection[] {
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

export function mapListProficiencies(
  entries: unknown[],
): BackgroundProficiencies {
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

export function splitEntries(raw: Raw): {
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
