import { NAMES_JSON_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { XDMG_NPC_NAME_TABLES } from "@/shared/data/xdmg-npc-name-tables.data";

interface FiveToolsNameRangeRow {
  min: number;
  max: number;
  result: string;
}

interface FiveToolsNameSubTable {
  option: string;
  diceExpression: string;
  table: FiveToolsNameRangeRow[];
}

interface FiveToolsSpeciesNames {
  name: string;
  tables: FiveToolsNameSubTable[];
}

interface FiveToolsNamesFile {
  name: FiveToolsSpeciesNames[];
}

export type DndNameGender = "male" | "female" | "random";

export interface PickRandomDndNameOptions {
  speciesName?: string | null;
  gender?: DndNameGender;
}

const SPECIES_NAME_ALIASES: Record<string, string> = {
  orc: "Half-Orc",
};

let namesFilePromise: Promise<FiveToolsNamesFile> | null = null;

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function normalizeSpeciesKey(value: string): string {
  return value.trim().toLowerCase();
}

function resolveSpeciesNamesKey(speciesName?: string | null): string | null {
  if (!speciesName?.trim()) return null;
  const normalized = normalizeSpeciesKey(speciesName);
  return SPECIES_NAME_ALIASES[normalized] ?? speciesName.trim();
}

export async function loadDndNameTables(): Promise<void> {
  await getNamesFile();
}

async function getNamesFile(): Promise<FiveToolsNamesFile> {
  if (!namesFilePromise) {
    namesFilePromise = fetchFiveToolsJson<FiveToolsNamesFile>(
      NAMES_JSON_URL,
      "names.json",
    );
  }
  return namesFilePromise;
}

function filterSubTablesByGender(
  tables: FiveToolsNameSubTable[],
  gender: DndNameGender,
): FiveToolsNameSubTable[] {
  if (gender === "random") return tables;

  const label = gender === "female" ? "Female" : "Male";
  const gendered = tables.filter((table) =>
    new RegExp(`\\b${label}\\b`, "i").test(table.option),
  );
  return gendered.length > 0 ? gendered : tables;
}

function rollOnRangeTable(
  diceExpression: string,
  rows: FiveToolsNameRangeRow[],
): string | null {
  const match = diceExpression.trim().match(/^d(\d+)$/i);
  const sides = match ? parseInt(match[1], 10) : 100;
  const roll = rollDie(sides);
  const row = rows.find((entry) => roll >= entry.min && roll <= entry.max);
  return row?.result ?? pickRandom(rows)?.result ?? null;
}

function pickSpeciesName(
  namesFile: FiveToolsNamesFile,
  speciesName: string,
  gender: DndNameGender,
): string | null {
  const lookupKey = resolveSpeciesNamesKey(speciesName);
  if (!lookupKey) return null;

  const speciesEntry = namesFile.name.find(
    (entry) => normalizeSpeciesKey(entry.name) === normalizeSpeciesKey(lookupKey),
  );
  if (!speciesEntry?.tables.length) return null;

  const subTables = filterSubTablesByGender(speciesEntry.tables, gender);
  const subTable = pickRandom(subTables);
  if (!subTable) return null;

  return rollOnRangeTable(subTable.diceExpression, subTable.table);
}

function pickXdmgNpcName(): string {
  const table = pickRandom(XDMG_NPC_NAME_TABLES);
  if (!table) return "Adventurer";

  const roll = rollDie(12);
  const row =
    table.rows.find((entry) => entry.roll === roll) ?? pickRandom(table.rows);
  if (!row) return "Adventurer";

  return `${row.given} ${row.surname}`;
}

/**
 * Picks a random D&D name from 5etools species tables (names.json) and/or
 * XDMG NPC name tables. Species-specific tables are preferred when available.
 */
export async function pickRandomDndName(
  options: PickRandomDndNameOptions = {},
): Promise<string> {
  const gender = options.gender ?? "random";
  const namesFile = await getNamesFile();

  const strategies: Array<() => string | null> = [];

  if (options.speciesName) {
    strategies.push(() =>
      pickSpeciesName(namesFile, options.speciesName!, gender),
    );
  }

  strategies.push(() => pickXdmgNpcName());

  const shuffled = [...strategies].sort(() => Math.random() - 0.5);
  for (const strategy of shuffled) {
    const result = strategy();
    if (result?.trim()) return result.trim();
  }

  return "Adventurer";
}
