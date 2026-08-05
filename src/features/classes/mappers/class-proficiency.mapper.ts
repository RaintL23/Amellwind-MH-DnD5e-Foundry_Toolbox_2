import type { ClassMetaListGroup } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
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
    if (key === "anyArtisansTool" && typeof value === "number") {
      parts.push(
        `${value} artisan's tool${value > 1 ? "s" : ""} of your choice`,
      );
    }
    if (key === "anyArtisanTool" && typeof value === "number") {
      parts.push(
        `${value} artisan's tool${value > 1 ? "s" : ""} of your choice`,
      );
    }
    if (key === "anyMusicalInstrument" && typeof value === "number") {
      parts.push(
        `${value} musical instrument${value > 1 ? "s" : ""} of your choice`,
      );
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

  const toolItems = raw.tools?.length
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
