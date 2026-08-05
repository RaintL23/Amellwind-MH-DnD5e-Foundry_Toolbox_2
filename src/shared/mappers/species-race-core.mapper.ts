import type {
  AbilityBonus,
  AbilityBonusChoose,
  AbilityBonusFixed,
  AbilityKey,
  DamageType,
  SpeciesTable,
  SpeciesTrait,
} from "@/shared/types";
import { ABILITY_LABELS } from "@/shared/types";
import { ABILITY_KEYS } from "@/shared/constants/dnd";
import { SIZE_MAP } from "@/shared/utils/cr.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function mapSizes<T extends string>(
  size: unknown,
  defaultSize: T = "Medium" as T,
): T[] {
  if (!Array.isArray(size)) return [defaultSize];
  return size.map((s) => (SIZE_MAP[String(s)] ?? String(s)) as T);
}

export interface FormatSpeedOptions {
  /** When true, walk speed is prefixed with "walk " (Amellwind species). */
  prefixWalk?: boolean;
}

export function formatSpeed(
  speed: unknown,
  options: FormatSpeedOptions = {},
): string {
  const { prefixWalk = false } = options;
  if (typeof speed === "number") return `${speed} ft.`;
  if (typeof speed === "string") return speed;
  if (typeof speed !== "object" || speed === null) return "—";
  const s = speed as Raw;
  const parts: string[] = [];
  if (typeof s.walk === "number") {
    parts.push(prefixWalk ? `walk ${s.walk} ft.` : `${s.walk} ft.`);
  }
  if (typeof s.fly === "number") parts.push(`fly ${s.fly} ft.`);
  if (typeof s.swim === "number") parts.push(`swim ${s.swim} ft.`);
  if (typeof s.climb === "number") parts.push(`climb ${s.climb} ft.`);
  if (typeof s.burrow === "number") parts.push(`burrow ${s.burrow} ft.`);
  return parts.length ? parts.join(", ") : "—";
}

export function mapAbilityBonuses(ability: unknown): AbilityBonus[] {
  if (!Array.isArray(ability)) return [];
  const result: AbilityBonus[] = [];
  for (const block of ability) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;

    const fixed: Partial<Record<AbilityKey, number>> = {};
    for (const key of ABILITY_KEYS) {
      if (typeof b[key] === "number") fixed[key] = b[key];
    }
    if (Object.keys(fixed).length) {
      result.push({
        kind: "fixed",
        bonuses: fixed,
      } satisfies AbilityBonusFixed);
    }

    if (b.choose) {
      const choose = b.choose as Raw;
      result.push({
        kind: "choose",
        from: (Array.isArray(choose.from) ? choose.from : []).map(
          String,
        ) as AbilityKey[],
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
          .map(([k, v]) => `${ABILITY_LABELS[k as AbilityKey]} +${v}`)
          .join(", ");
      }
      if (b.kind === "weightedDistribution") {
        const opts = b.from.map((k) => ABILITY_LABELS[k]).join(" / ");
        const modes = b.modes.map((mode) => mode.label).join(" or ");
        return `${opts}: ${modes}`;
      }
      const opts = b.from.map((k) => ABILITY_LABELS[k]).join(" / ");
      const count = b.count && b.count > 1 ? `${b.count}× ` : "";
      return `${count}+${b.amount} ${opts}`;
    })
    .join(" · ");
}

export function mapSpeciesRaceTable(raw: Raw): SpeciesTable {
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
    colLabels: Array.isArray(raw.colLabels) ? raw.colLabels.map(String) : [],
    rows,
  };
}

export function collectTraitContent(entries: unknown[]): {
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
      tables.push(mapSpeciesRaceTable(e));
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

export function mapTraits(entries: unknown[]): SpeciesTrait[] {
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
    traits.push({
      name,
      entries: texts,
      tables: tables.length ? tables : undefined,
    });
  }

  return traits;
}

export interface MapResistancesOptions {
  /** Prefix for choose-summary text (e.g. "elige:" vs "choose:"). */
  choosePrefix?: string;
}

export function mapResistances(
  resist: unknown,
  options: MapResistancesOptions = {},
): {
  fixed: DamageType[];
  summary: string;
} {
  const { choosePrefix = "choose:" } = options;
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

  const summary = chooseParts.length
    ? `${choosePrefix} ${chooseParts.join("; ")}`
    : "";

  return { fixed, summary };
}
