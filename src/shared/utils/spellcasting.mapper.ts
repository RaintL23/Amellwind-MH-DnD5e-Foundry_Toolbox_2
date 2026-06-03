import type {
  SpellcastingSpellLine,
} from "@/shared/types/statblock-content.types";
import type { SpellcastingBlock } from "@/shared/types/bestiary-creature.types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { mapStatBlockEntries } from "@/shared/utils/statblock-entries.mapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const ORDINALS = [
  "",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
];

function parseSpellRef(spell: unknown): string {
  return typeof spell === "string" ? parseFiveToolsMarkup(spell) : String(spell ?? "");
}

function dailyLabel(key: string): string {
  if (key === "will") return "At will";
  if (key.endsWith("e")) {
    const count = key.slice(0, -1);
    return `${count}/day each`;
  }
  return `${key}/day`;
}

function mapDailySpells(daily: Raw): SpellcastingSpellLine[] {
  return Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([key, value]) => ({
      label: dailyLabel(key),
      spells: Array.isArray(value) ? value.map(parseSpellRef) : [],
    }))
    .filter((line) => line.spells.length > 0);
}

function mapLeveledSpells(spells: Raw): SpellcastingSpellLine[] {
  return Object.keys(spells)
    .sort((a, b) => Number(a) - Number(b))
    .map((levelKey) => {
      const level = Number(levelKey);
      const block = spells[levelKey] as Raw;
      const spellList = Array.isArray(block?.spells)
        ? (block.spells as unknown[]).map(parseSpellRef)
        : [];
      const slots =
        typeof block?.slots === "number" ? ` (${block.slots} slots)` : "";
      const label =
        level === 0 ? "Cantrips" : `${ORDINALS[level] ?? `${level}th`} level${slots}`;
      return { label, spells: spellList };
    })
    .filter((line) => line.spells.length > 0);
}

export function mapSpellcastingBlocks(raw: unknown[]): SpellcastingBlock[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((s): s is Raw => typeof s === "object" && s !== null)
    .map((s) => {
      const spellLines: SpellcastingSpellLine[] = [];

      if (Array.isArray(s.will)) {
        spellLines.push({
          label: "At will",
          spells: s.will.map(parseSpellRef),
        });
      }

      if (s.daily && typeof s.daily === "object") {
        spellLines.push(...mapDailySpells(s.daily as Raw));
      }

      if (s.spells && typeof s.spells === "object") {
        spellLines.push(...mapLeveledSpells(s.spells as Raw));
      }

      return {
        name: String(s.name ?? "Spellcasting"),
        displayAs: typeof s.displayAs === "string" ? s.displayAs : undefined,
        header: Array.isArray(s.headerEntries)
          ? mapStatBlockEntries(s.headerEntries as unknown[])
          : [],
        spellLines,
        footer: Array.isArray(s.footerEntries)
          ? mapStatBlockEntries(s.footerEntries as unknown[])
          : [],
      };
    });
}
