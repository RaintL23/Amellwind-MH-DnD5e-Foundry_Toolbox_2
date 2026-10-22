import type { ClassMetaListGroup } from "@/shared/types";
import type {
  NamedProficiencyGrant,
  ProficiencySource,
} from "@/shared/types/proficiency.types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import type {
  RawProficiencyBlock,
  RawProficiencyEntry,
  RawStartingEquipment,
  RawStartingProficiencies,
} from "../utils/class-raw.types";

function titleCaseProficiency(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatProficiencyLabel(value: string): string {
  return value.includes("{@")
    ? parseFiveToolsMarkup(value)
    : titleCaseProficiency(value);
}

function formatChooseFrom(from: unknown[], count = 1): string {
  const options = from
    .map((item) =>
      typeof item === "string" ? formatProficiencyLabel(item) : String(item ?? ""),
    )
    .filter(Boolean);
  return `Choose ${count} from ${options.join(", ")}`;
}

function isWeaponProficiency(
  entry: Record<string, unknown>,
): entry is { proficiency: string; optional?: boolean } {
  return typeof entry.proficiency === "string";
}

function mapProficiencyBlock(block: RawProficiencyBlock): string[] {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(block)) {
    if (key === "choose" || key === "_") continue;
    if (value === true) parts.push(formatProficiencyLabel(key));
    if (
      (key === "anyArtisansTool" || key === "anyArtisanTool") &&
      typeof value === "number"
    ) {
      parts.push(`Choose ${value} Artisan's Tool${value > 1 ? "s" : ""}`);
    }
    if (key === "anyMusicalInstrument" && typeof value === "number") {
      parts.push(`Choose ${value} Musical Instrument${value > 1 ? "s" : ""}`);
    }
  }

  const choose = block.choose;
  if (choose && Array.isArray(choose.from) && choose.from.length) {
    const count = typeof choose.count === "number" ? choose.count : 1;
    parts.push(formatChooseFrom(choose.from, count));
  }

  return parts;
}

function formatProficiencyEntry(entry: RawProficiencyEntry): string[] {
  if (typeof entry === "string") {
    const text = formatProficiencyLabel(entry);
    return text ? [text] : [];
  }

  if (typeof entry !== "object" || entry === null) return [];

  const obj = entry as Record<string, unknown>;

  if (isWeaponProficiency(obj)) {
    const name = formatProficiencyLabel(obj.proficiency);
    return obj.optional ? [`${name} (optional)`] : [name];
  }

  if (typeof obj.any === "number") {
    return [`Choose ${obj.any} of your choice`];
  }

  const choose = obj.choose as { from?: unknown[]; count?: number } | undefined;
  if (choose && Array.isArray(choose.from) && choose.from.length) {
    return [formatChooseFrom(choose.from, choose.count ?? 1)];
  }

  return mapProficiencyBlock(obj as RawProficiencyBlock);
}

/**
 * Tool blocks for grant parsing. 5etools ships `tools` (display prose such as
 * "one type of artisan's tools of your choice") alongside the structured
 * `toolProficiencies`; parsing both duplicates every grant.
 */
function classToolProficiencyBlocks(raw?: {
  tools?: string[];
  toolProficiencies?: RawProficiencyBlock[];
}): unknown[] {
  if (raw?.toolProficiencies?.length) return raw.toolProficiencies;
  return raw?.tools ?? [];
}

/**
 * Class tool grants. Several structured blocks are alternatives (Monk: "one
 * type of artisan's tools or a musical instrument"), so single-pick blocks
 * merge into one pick over the union of their options.
 */
export function parseClassToolGrants(
  raw: { tools?: string[]; toolProficiencies?: RawProficiencyBlock[] } | undefined,
  source: ProficiencySource,
): NamedProficiencyGrant[] {
  const blocks = classToolProficiencyBlocks(raw);
  if ((raw?.toolProficiencies?.length ?? 0) < 2) {
    return parseNamedProficiencyBlocks(blocks, source);
  }
  const alternatives = blocks.map((block) => parseNamedProficiencyBlocks([block], source));
  const picks = alternatives.flatMap((grants) =>
    grants.length === 1 && grants[0].kind === "any" && grants[0].count === 1
      ? [grants[0]]
      : [],
  );
  if (picks.length !== alternatives.length) {
    return parseNamedProficiencyBlocks(blocks, source);
  }
  const options = [...new Set(picks.flatMap((pick) => pick.options ?? []))];
  return [
    {
      kind: "any",
      count: 1,
      label: picks
        .map((pick, index) => (index === 0 ? pick.label : pick.label.toLowerCase()))
        .join(" or "),
      options: options.sort((a, b) => a.localeCompare(b)),
      source,
    },
  ];
}

function mapProficiencyList(entries?: RawProficiencyEntry[]): string[] {
  if (!entries?.length) return [];
  return entries.flatMap(formatProficiencyEntry).filter(Boolean);
}

export function mapStartingProficiencies(
  raw?: RawStartingProficiencies,
): ClassMetaListGroup[] {
  if (!raw) return [];
  const groups: ClassMetaListGroup[] = [];

  const armorItems = mapProficiencyList(raw.armor);
  if (armorItems.length) {
    groups.push({ label: "Armor", items: armorItems });
  }

  const weaponItems = mapProficiencyList(raw.weapons);
  if (weaponItems.length) {
    groups.push({ label: "Weapons", items: weaponItems });
  }

  // A single structured block shows picks as "Choose 1 …" instead of prose that
  // reads like a fixed item; several blocks are alternatives ("… or …"), which
  // only the prose expresses.
  const toolItems =
    raw.toolProficiencies?.length === 1
      ? mapProficiencyBlock(raw.toolProficiencies[0])
      : raw.tools?.length
        ? raw.tools.map((tool) => parseFiveToolsMarkup(tool))
        : (raw.toolProficiencies ?? []).flatMap(mapProficiencyBlock);

  if (toolItems.length) {
    groups.push({ label: "Tools", items: toolItems });
  }

  const languageItems = mapProficiencyList(raw.languages);
  if (languageItems.length) {
    groups.push({ label: "Languages", items: languageItems });
  }

  const skillItems = mapProficiencyList(raw.skills);
  if (skillItems.length) {
    groups.push({ label: "Skills", items: skillItems });
  }

  return groups;
}

export function mapStartingEquipment(raw?: RawStartingEquipment): string[] {
  if (!raw) return [];
  const lines = (raw.default ?? raw.entries ?? []).map((line) =>
    parseFiveToolsMarkup(line),
  );
  if (raw.goldAlternative) {
    lines.push(parseFiveToolsMarkup(raw.goldAlternative));
  }
  if (raw.additionalFromBackground) {
    lines.push("Plus equipment from background");
  }
  return lines;
}
