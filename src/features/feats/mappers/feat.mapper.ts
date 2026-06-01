import {
  Feat,
  FeatAbilityIncrease,
  FeatSection,
} from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const ABILITY_LABELS: Record<string, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

function featId(raw: Raw): string {
  return `${raw.name}::${raw.source}`;
}

function renderListItems(items: unknown[], depth = 0): string[] {
  const prefix = depth > 0 ? "  " : "";
  const result: string[] = [];

  for (const item of items) {
    if (typeof item === "string") {
      const text = parseFiveToolsMarkup(item).trim();
      if (text) result.push(`${prefix}• ${text}`);
      continue;
    }
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Raw;

    if (obj.type === "entries" && obj.name) {
      const name = parseFiveToolsMarkup(String(obj.name));
      const nested = Array.isArray(obj.entries)
        ? renderEntries(obj.entries as unknown[], depth + 1)
        : [];
      result.push(`${prefix}**${name}**`);
      result.push(...nested);
    } else if (Array.isArray(obj.entries)) {
      result.push(...renderEntries(obj.entries as unknown[], depth + 1));
    }
  }

  return result;
}

function renderEntries(entries: unknown[], depth = 0): string[] {
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
      result.push(...renderListItems(obj.items as unknown[], depth));
    } else if (obj.type === "inset" && Array.isArray(obj.entries)) {
      const inset = renderEntries(obj.entries as unknown[], depth);
      if (inset.length) {
        result.push(...inset.map((line) => (depth === 0 ? `» ${line}` : line)));
      }
    } else if (obj.type === "entries" && obj.name) {
      const name = parseFiveToolsMarkup(String(obj.name));
      const nested = Array.isArray(obj.entries)
        ? renderEntries(obj.entries as unknown[], depth + 1)
        : [];
      result.push(`**${name}**`);
      result.push(...nested);
    } else if (obj.type === "homebrew" && Array.isArray(obj.entries)) {
      for (const sub of obj.entries as Raw[]) {
        if (sub.name && Array.isArray(sub.items)) {
          result.push(`**${parseFiveToolsMarkup(String(sub.name))}**`);
          result.push(
            ...renderListItems(sub.items as unknown[], depth),
          );
        }
      }
    } else if (Array.isArray(obj.entries)) {
      result.push(...renderEntries(obj.entries as unknown[], depth));
    }
  }

  return result;
}

function mapAbilityIncreases(raw: Raw): FeatAbilityIncrease[] {
  if (!Array.isArray(raw.ability)) return [];

  const result: FeatAbilityIncrease[] = [];

  for (const block of raw.ability as Raw[]) {
    const choose = block.choose as Raw | undefined;
    if (choose && Array.isArray(choose.from)) {
      const abilities = (choose.from as string[])
        .map((k) => ABILITY_LABELS[k] ?? k.toUpperCase())
        .join(" or ");
      const amount = typeof choose.amount === "number" ? choose.amount : 1;
      result.push({
        label: `${abilities} +${amount} (choose)`,
      });
      continue;
    }

    for (const [key, value] of Object.entries(block)) {
      if (key === "choose") continue;
      const label = ABILITY_LABELS[key];
      if (label && typeof value === "number") {
        result.push({ label: `${label} +${value}` });
      }
    }
  }

  return result;
}

function mapPrerequisites(raw: Raw): string[] {
  if (!Array.isArray(raw.prerequisite)) return [];
  const parts: string[] = [];

  for (const prereq of raw.prerequisite as Raw[]) {
    if (Array.isArray(prereq.ability)) {
      for (const ab of prereq.ability as Raw[]) {
        for (const [key, value] of Object.entries(ab)) {
          const label = ABILITY_LABELS[key];
          if (label && typeof value === "number") {
            parts.push(`${label} ${value}+`);
          }
        }
      }
    }
    if (prereq.level && typeof prereq.level.level === "number") {
      parts.push(`Level ${prereq.level.level}+`);
    }
    if (typeof prereq.other === "string" && prereq.other.trim()) {
      parts.push(prereq.other.trim());
    }
  }

  return parts;
}

function splitSections(paragraphs: string[]): {
  lead: string[];
  sections: FeatSection[];
} {
  const lead: string[] = [];
  const sections: FeatSection[] = [];
  let current: FeatSection | null = null;

  for (const line of paragraphs) {
    const isHeader = /^\*\*.+\*\*$/.test(line);
    if (isHeader) {
      if (current && current.paragraphs.length) sections.push(current);
      current = {
        name: line.replace(/^\*\*|\*\*$/g, ""),
        paragraphs: [],
      };
    } else if (current) {
      current.paragraphs.push(line);
    } else {
      lead.push(line);
    }
  }

  if (current && (current.name || current.paragraphs.length)) {
    sections.push(current);
  }

  return { lead, sections };
}

function buildSummary(
  prerequisites: string[],
  abilityIncreases: FeatAbilityIncrease[],
  paragraphs: string[],
): string {
  const parts: string[] = [];
  if (prerequisites.length) parts.push(prerequisites.join(" · "));
  if (abilityIncreases.length) {
    parts.push(abilityIncreases.map((a) => a.label).join(", "));
  }
  const first = paragraphs.find((p) => !p.startsWith("•") && !p.startsWith("»"));
  if (first) parts.push(first.slice(0, 120) + (first.length > 120 ? "…" : ""));
  return parts.join(" — ") || "";
}

const REPEATABLE_PATTERN = /can select this feat multiple times/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFeat(raw: any): Feat {
  const entries = Array.isArray(raw.entries) ? (raw.entries as unknown[]) : [];
  const allParagraphs = renderEntries(entries);
  const { lead, sections } = splitSections(allParagraphs);
  const prerequisites = mapPrerequisites(raw);
  const abilityIncreases = mapAbilityIncreases(raw);
  const repeatable = allParagraphs.some((p) => REPEATABLE_PATTERN.test(p));

  return {
    id: featId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    prerequisites,
    abilityIncreases,
    paragraphs: lead,
    sections,
    repeatable,
    summary: buildSummary(prerequisites, abilityIncreases, lead),
  };
}
