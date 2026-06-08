import type {
  AbilityBonus,
  AbilityBonusFixed,
  AbilityBonusChoose,
  SpeciesTrait,
  SpeciesTable,
  AbilityKey,
  DamageType,
  DndRace,
  DndRaceKind,
  DndRaceSize,
} from "@/shared/types";
import { ABILITY_LABELS as LABELS } from "@/shared/types";
import { SIZE_MAP } from "@/shared/utils/cr.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  parseSkillProficiencyBlocks,
  parseSkillAdvantagesFromTraits,
} from "@/shared/utils/skill-proficiency.parser";
import { parseOriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function raceId(raw: Raw): string {
  const parent = raw.raceName ? `::${raw.raceName}` : "";
  return `${raw.name}::${raw.source}${parent}`;
}

function inferKind(raw: Raw): DndRaceKind {
  if (raw.raceName) {
    const name = String(raw.name ?? "");
    if (/lineage|variant/i.test(name)) return "lineage";
    return "subrace";
  }
  if (raw.lineage) return "lineage";
  return "species";
}

function mapSizes(size: unknown): DndRaceSize[] {
  if (!Array.isArray(size)) return ["Medium"];
  return size.map((s) => (SIZE_MAP[String(s)] ?? String(s)) as DndRaceSize);
}

function formatSpeed(speed: unknown): string {
  if (typeof speed === "number") return `${speed} ft.`;
  if (typeof speed === "string") return speed;
  if (typeof speed !== "object" || speed === null) return "—";
  const s = speed as Raw;
  const parts: string[] = [];
  if (typeof s.walk === "number") parts.push(`${s.walk} ft.`);
  if (typeof s.fly === "number") parts.push(`fly ${s.fly} ft.`);
  if (typeof s.swim === "number") parts.push(`swim ${s.swim} ft.`);
  if (typeof s.climb === "number") parts.push(`climb ${s.climb} ft.`);
  if (typeof s.burrow === "number") parts.push(`burrow ${s.burrow} ft.`);
  return parts.length ? parts.join(", ") : "—";
}

function mapAbilityBonuses(ability: unknown): AbilityBonus[] {
  if (!Array.isArray(ability)) return [];
  const result: AbilityBonus[] = [];
  for (const block of ability) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;
    const fixed: Partial<Record<AbilityKey, number>> = {};
    for (const key of ["str", "dex", "con", "int", "wis", "cha"] as AbilityKey[]) {
      if (typeof b[key] === "number") fixed[key] = b[key];
    }
    if (Object.keys(fixed).length) {
      result.push({ kind: "fixed", bonuses: fixed } satisfies AbilityBonusFixed);
    }
    if (b.choose) {
      const choose = b.choose as Raw;
      result.push({
        kind: "choose",
        from: (Array.isArray(choose.from) ? choose.from : []).map(String) as AbilityKey[],
        amount: Number(choose.amount ?? 1),
        count: typeof choose.count === "number" ? choose.count : undefined,
      } satisfies AbilityBonusChoose);
    }
  }
  return result;
}

export function formatAbilitySummary(bonuses: AbilityBonus[]): string {
  if (!bonuses.length) return "—";
  return bonuses
    .map((b) => {
      if (b.kind === "fixed") {
        return Object.entries(b.bonuses)
          .map(([k, v]) => `${LABELS[k as AbilityKey]} +${v}`)
          .join(", ");
      }
      const opts = b.from.map((k) => LABELS[k]).join(" / ");
      const count = b.count && b.count > 1 ? `${b.count}× ` : "";
      return `${count}+${b.amount} ${opts}`;
    })
    .join(" · ");
}

function mapTable(raw: Raw): SpeciesTable {
  const rows = Array.isArray(raw.rows)
    ? (raw.rows as unknown[][]).map((row) =>
        row.map((cell) =>
          typeof cell === "string" ? parseFiveToolsMarkup(cell) : String(cell ?? ""),
        ),
      )
    : [];
  return {
    caption: typeof raw.caption === "string" ? raw.caption : undefined,
    colLabels: Array.isArray(raw.colLabels) ? raw.colLabels.map(String) : [],
    rows,
  };
}

function collectTraitContent(entries: unknown[]): {
  texts: string[];
  tables: SpeciesTable[];
} {
  const texts: string[] = [];
  const tables: SpeciesTable[] = [];
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
      const nested = collectTraitContent(e.entries as unknown[]);
      texts.push(...nested.texts);
      tables.push(...nested.tables);
    }
  }
  return { texts, tables };
}

function mapTraits(entries: unknown[]): SpeciesTrait[] {
  if (!Array.isArray(entries)) return [];
  const traits: SpeciesTrait[] = [];
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    const name = String(e.name ?? "").trim();
    if (!name) continue;
    const { texts, tables } = collectTraitContent(
      Array.isArray(e.entries) ? (e.entries as unknown[]) : [],
    );
    traits.push({ name, entries: texts, tables: tables.length ? tables : undefined });
  }
  return traits;
}

function mapResistances(resist: unknown): { fixed: DamageType[]; summary: string } {
  if (!Array.isArray(resist)) return { fixed: [], summary: "" };
  const fixed: DamageType[] = [];
  const chooseParts: string[] = [];
  for (const item of resist) {
    if (typeof item === "string") {
      fixed.push(item as DamageType);
      continue;
    }
    if (typeof item !== "object" || item === null) continue;
    const r = item as Raw;
    if (r.choose && Array.isArray((r.choose as Raw).from)) {
      const from = ((r.choose as Raw).from as unknown[]).map(String);
      chooseParts.push(from.join(" / "));
    }
  }
  const summary = chooseParts.length ? `choose: ${chooseParts.join("; ")}` : "";
  return { fixed, summary };
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
          return obj.entries
            .filter((t: unknown) => typeof t === "string")
            .map((t: string) => parseFiveToolsMarkup(t))
            .join(" ");
        }
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDndRace(raw: any): DndRace {
  const abilityBonuses = mapAbilityBonuses(raw.ability);
  const { fixed: resistances, summary: resistanceSummary } = mapResistances(raw.resist);
  const traits = mapTraits(raw.entries);
  const raceSource = { type: "species" as const, name: String(raw.name ?? "Unknown") };
  const skillGrants = parseSkillProficiencyBlocks(
    Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
    raceSource,
  );
  const skillAdvantages = parseSkillAdvantagesFromTraits(traits, raceSource);

  return {
    id: raceId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "PHB"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    kind: inferKind(raw),
    parentName: raw.raceName ? String(raw.raceName) : undefined,
    parentSource: raw.raceSource ? String(raw.raceSource) : undefined,
    sizes: mapSizes(raw.size),
    speed: formatSpeed(raw.speed),
    abilityBonuses,
    abilitySummary: formatAbilitySummary(abilityBonuses),
    darkvision: typeof raw.darkvision === "number" ? raw.darkvision : undefined,
    resistances,
    resistanceSummary,
    traitTags: Array.isArray(raw.traitTags) ? raw.traitTags.map(String) : [],
    traits,
    fluff: mapFluff(raw.fluff),
    skillGrants,
    skillAdvantages,
    originFeatGrant: parseOriginFeatGrant(raw.feats),
  };
}
