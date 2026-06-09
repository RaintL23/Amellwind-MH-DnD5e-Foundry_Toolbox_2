/**
 * Language names for builder pickers — sourced from 5etools languages.json
 * plus Monster Hunter–specific species languages.
 */
import languagesRaw from "../../../backup-jsons/5etools/languages.json";

/** MH ancestries / species languages not always present in 5etools. */
const MONSTER_HUNTER_LANGUAGES = [
  "Lynian",
  "Troverian",
  "Wyverian",
  "Felyne",
  "Melynx",
  "Grimalkyne",
  "Boaboa",
  "Shakalaka",
  "Gajalaka",
] as const;

const MH_SOURCE_CODE = "AGMH";

/** Friendly labels for book / adventure source codes. */
const BOOK_SOURCE_LABELS: Record<string, string> = {
  XPHB: "Player's Handbook 2024",
  PHB: "Player's Handbook 2014",
  XGE: "Xanathar's Guide to Everything",
  TCE: "Tasha's Cauldron of Everything",
  SCAG: "Sword Coast Adventurer's Guide",
  VGM: "Volo's Guide to Monsters",
  MPMM: "Mordenkainen Presents: Monsters of the Multiverse",
  GGR: "Guildmasters' Guide to Ravnica",
  ERLW: "Eberron: Rising from the Last War",
  MOT: "Mythic Odysseys of Theros",
  EGW: "Explorer's Guide to Wildemount",
  AAG: "Astral Adventurer's Guide",
  BMT: "The Book of Many Things",
  EFA: "Eberron: Forge of the Artificer",
  FRHoF: "Forgotten Realms: Heroes of Faerûn",
  AGMH: "Guide to Monster Hunting",
};

const SOURCE_DISPLAY_PRIORITY = [
  "XPHB",
  "PHB",
  "AGMH",
  "MPMM",
  "XGE",
  "TCE",
] as const;

/** Accordions open by default when picking a language. */
export const DEFAULT_OPEN_LANGUAGE_SOURCES: readonly string[] = ["XPHB"];

interface LanguageEntry {
  name?: string;
  type?: string;
  source?: string;
}

export interface LanguageSourceGroup {
  sourceCode: string;
  label: string;
  languages: string[];
}

function resolveSourceLabel(sourceCode: string): string {
  return BOOK_SOURCE_LABELS[sourceCode] ?? sourceCode;
}

function sortLanguageGroups(groups: LanguageSourceGroup[]): LanguageSourceGroup[] {
  const priority = new Map<string, number>(
    SOURCE_DISPLAY_PRIORITY.map((code, index) => [code, index]),
  );

  return [...groups].sort((a, b) => {
    const pa = priority.get(a.sourceCode) ?? Number.MAX_SAFE_INTEGER;
    const pb = priority.get(b.sourceCode) ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}

function collectLanguageSourceGroups(): LanguageSourceGroup[] {
  const raw = languagesRaw as { language?: LanguageEntry[] };
  const bySource = new Map<string, Set<string>>();

  for (const entry of raw.language ?? []) {
    const name = entry.name?.trim();
    const source = entry.source?.trim();
    if (!name || !source) continue;
    if (!bySource.has(source)) bySource.set(source, new Set());
    bySource.get(source)!.add(name);
  }

  bySource.set(MH_SOURCE_CODE, new Set(MONSTER_HUNTER_LANGUAGES));

  const groups = [...bySource.entries()].map(([sourceCode, names]) => ({
    sourceCode,
    label: resolveSourceLabel(sourceCode),
    languages: [...names].sort((a, b) => a.localeCompare(b)),
  }));

  return sortLanguageGroups(groups);
}

function collectFlatLanguageNames(groups: LanguageSourceGroup[]): string[] {
  const names = new Set<string>();
  for (const group of groups) {
    for (const name of group.languages) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

const LANGUAGE_SOURCE_GROUPS = collectLanguageSourceGroups();

/** Languages grouped by book / adventure source (for accordion pickers). */
export const LANGUAGE_GROUPS_BY_SOURCE: readonly LanguageSourceGroup[] =
  LANGUAGE_SOURCE_GROUPS;

/** Flat deduplicated list (parser + legacy consumers). */
export const CHOOSEABLE_LANGUAGES: readonly string[] =
  collectFlatLanguageNames(LANGUAGE_SOURCE_GROUPS);

/** PHB-style standard set (used when data only says "standard language"). */
export const STANDARD_LANGUAGES: readonly string[] = [
  "Common",
  "Dwarvish",
  "Elvish",
  "Giant",
  "Gnomish",
  "Goblin",
  "Halfling",
  "Orc",
] as const;

/** Filter source groups to languages allowed for this picker. */
export function filterLanguageGroups(
  allowed: ReadonlySet<string> | readonly string[],
  excluded: readonly string[] = [],
): LanguageSourceGroup[] {
  const allowedSet =
    allowed instanceof Set ? allowed : new Set(allowed);
  const excludedLower = new Set(excluded.map((l) => l.toLowerCase()));

  return LANGUAGE_GROUPS_BY_SOURCE.map((group) => ({
    ...group,
    languages: group.languages.filter(
      (name) =>
        allowedSet.has(name) && !excludedLower.has(name.toLowerCase()),
    ),
  })).filter((group) => group.languages.length > 0);
}
