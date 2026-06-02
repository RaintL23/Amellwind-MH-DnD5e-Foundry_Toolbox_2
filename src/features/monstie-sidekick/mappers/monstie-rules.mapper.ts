import type { MonstieRulesContent } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import type { DowntimeTable } from "@/shared/types";
import { mapMonster } from "@/features/monsters/mappers/monster.mapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** Normalizes inline statblock JSON (5etools) for mapMonster. */
function normalizeInlineStatblock(data: Raw): Raw {
  const copy: Raw = { ...data };

  if (Array.isArray(copy.size) && copy.size.length > 0) {
    copy.size = copy.size[0];
  }

  if (Array.isArray(copy.ac)) {
    copy.ac = copy.ac.map((entry: Raw) => {
      if (typeof entry !== "object" || entry === null) return entry;
      if (entry.special && !entry.ac) {
        const match = String(entry.special).match(/(\d+)/);
        return match ? { ac: Number(match[1]), from: ["natural armor"] } : entry;
      }
      return entry;
    });
  }

  if (copy.hp?.special && !copy.hp.average) {
    const match = String(copy.hp.special).match(/(\d+)/);
    if (match) copy.hp = { ...copy.hp, average: Number(match[1]) };
  }

  if (Array.isArray(copy.senses)) {
    const parsed: Raw = {};
    for (const s of copy.senses) {
      const str = String(s).toLowerCase();
      const num = str.match(/(\d+)/)?.[1];
      if (str.includes("darkvision") && num) parsed.darkvision = num;
      if (str.includes("blindsight") && num) parsed.blindsight = num;
      if (str.includes("tremorsense") && num) parsed.tremorsense = num;
      if (str.includes("truesight") && num) parsed.truesight = num;
    }
    copy.senses = parsed;
  }

  if (copy.skill && typeof copy.skill === "object") {
    const normalized: Raw = {};
    for (const [key, val] of Object.entries(copy.skill as Raw)) {
      if (typeof val === "string") {
        const n = parseInt(val.replace(/[^\d-]/g, ""), 10);
        normalized[key] = Number.isNaN(n) ? val : n;
      } else {
        normalized[key] = val;
      }
    }
    copy.skill = normalized;
  }

  if (!copy.cr) copy.cr = "0";

  return copy;
}

function mapTable(raw: Raw): DowntimeTable {
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
  return {
    caption: typeof raw.caption === "string" ? raw.caption : undefined,
    colLabels,
    rows,
  };
}

function mapEntries(entries: unknown[]): MonstieRulesContent[] {
  const result: MonstieRulesContent[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      result.push({ type: "paragraph", text: parseFiveToolsMarkup(entry) });
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;

    const e = entry as Raw;

    if (e.type === "list" && Array.isArray(e.items)) {
      for (const item of e.items) {
        const text =
          typeof item === "string"
            ? parseFiveToolsMarkup(item)
            : String(item ?? "");
        result.push({ type: "paragraph", text: `• ${text}` });
      }
      continue;
    }

    if (e.type === "table") {
      result.push({ type: "table", table: mapTable(e) });
      continue;
    }

    if (e.type === "statblockInline" && e.data && typeof e.data === "object") {
      try {
        const monster = mapMonster(normalizeInlineStatblock(e.data as Raw));
        result.push({ type: "statblock", monster });
      } catch {
        result.push({
          type: "paragraph",
          text: `[Stat block: ${String((e.data as Raw).name ?? "Unknown")}]`,
        });
      }
      continue;
    }

    if (e.type === "abilityDc") {
      const name = typeof e.name === "string" ? e.name : "Monstie";
      const attrs = Array.isArray(e.attributes)
        ? e.attributes.map(String).join(", ")
        : "ability modifier";
      result.push({
        type: "paragraph",
        text: `${name} save DC = 8 + proficiency bonus + ${attrs}`,
      });
      continue;
    }

    if (e.type === "inset" && Array.isArray(e.entries)) {
      result.push({
        type: "section",
        name: "Nota",
        children: mapEntries(e.entries as unknown[]),
      });
      continue;
    }

    if (e.type === "entries" || typeof e.name === "string") {
      const name = typeof e.name === "string" ? parseFiveToolsMarkup(e.name).trim() : "";
      const children = mapEntries(
        Array.isArray(e.entries) ? (e.entries as unknown[]) : [],
      );
      if (name) {
        result.push({ type: "section", name, children });
      } else {
        result.push(...children);
      }
    }
  }

  return result;
}

export function mapMonstieRules(raw: Raw): MonstieRulesContent[] {
  const entries = Array.isArray(raw.entries) ? raw.entries : [];
  return mapEntries(entries);
}
