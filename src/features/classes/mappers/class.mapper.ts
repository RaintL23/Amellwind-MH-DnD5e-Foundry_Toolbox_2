import type {
  Class,
  ClassFeatureEntry,
  ClassLevelRow,
  ClassMetaListGroup,
  ClassTableGroup,
  Subclass,
  SubclassSpellBlock,
} from "@/shared/types";
import type { AbilityKey } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  mapStatBlockEntries,
  statBlockContentToPlainText,
} from "@/shared/utils/statblock-entries.mapper";
import { DEFAULT_CLASS_SOURCE } from "../utils/class-raw.types";
import {
  parseSkillProficiencyBlocks,
  parseSaveProficiencies,
} from "@/shared/utils/skill-proficiency.parser";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import { parseClassStartingEquipment } from "@/shared/utils/starting-equipment.parser";
import {
  extractFeatRefs,
  extractOptionalFeatureRefs,
  mergeOptionalFeatureProgressions,
} from "../utils/optional-feature-progression.utils";
import {
  extractClassFeatureChoiceProgressions,
  extractSubclassFeatureChoiceProgressions,
  mergeFeatureChoiceProgressions,
} from "../utils/feature-choice-progression.utils";
import type {
  ProcessedSubclass,
  RawClassDefinition,
  RawClassTableGroup,
  ClassTableCell,
  RawMulticlassing,
  RawProficiencyBlock,
  RawProficiencyEntry,
  RawStartingEquipment,
  RawStartingProficiencies,
  ResolvedFeature,
  SubclassSpellBlockRaw,
} from "../utils/class-raw.types";

const ABILITY_LABELS: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

const CASTER_LABELS: Record<string, string> = {
  full: "Full caster",
  "1/2": "Half caster",
  "1/3": "Third caster",
  artificer: "Artificer",
  pact: "Pact Magic",
  none: "None",
};

export function classId(name: string, source: string): string {
  return `${source}::${name}`;
}

function formatAbility(ab: string): string {
  return ABILITY_LABELS[ab.toLowerCase()] ?? ab.toUpperCase();
}

function contentToDescription(
  content: ReturnType<typeof mapStatBlockEntries>,
): string[] {
  return content
    .map(statBlockContentToPlainText)
    .map((line) => line.trim())
    .filter(Boolean);
}

function mapFeatureEntry(
  feature: ResolvedFeature,
  isSubclassFeature = false,
): ClassFeatureEntry {
  const uid = `${feature.name}|${feature.className}|${feature.classSource}|${feature.level}|${feature.source}`;
  const optionalFeatureRefs = extractOptionalFeatureRefs(feature.entries);
  const featRefs = extractFeatRefs(feature.entries);
  const content = mapStatBlockEntries(feature.entries);
  return {
    uid,
    name: feature.name,
    displayName: feature.displayName,
    level: feature.level,
    source: feature.source,
    content,
    description: contentToDescription(content),
    isSubclassFeature,
    gainSubclassFeature: feature.gainSubclassFeature,
    optionalFeatureRefs: optionalFeatureRefs.length
      ? optionalFeatureRefs
      : undefined,
    featRefs: featRefs.length ? featRefs : undefined,
  };
}

function formatDiceRoll(toRoll: { number: number; faces: number }[]): string {
  if (!toRoll?.length) return "—";
  return toRoll.map((d) => `${d.number}d${d.faces}`).join("+");
}

function formatCellValue(value: ClassTableCell): string {
  if (typeof value === "number") return value === 0 ? "—" : String(value);
  if (typeof value === "string") return parseFiveToolsMarkup(value);

  switch (value.type) {
    case "bonus":
      return value.value === 0 ? "—" : `+${value.value}`;
    case "bonusSpeed":
      return value.value === 0 ? "—" : `+${value.value} ft.`;
    case "dice":
      return formatDiceRoll(value.toRoll);
    default:
      return "—";
  }
}

/**
 * Extracts the "Spells Known" column from spell progression tables for known-casters.
 * Returns an array of 20 numbers or undefined.
 */
function extractSpellsKnownFromTableGroups(
  tableGroups?: RawClassTableGroup[],
): number[] | undefined {
  if (!tableGroups?.length) return undefined;
  for (const group of tableGroups) {
    const labels = group.colLabels ?? [];
    const rows = group.rows ?? [];
    const idx = labels.findIndex((l) =>
      String(l).toLowerCase().includes("spells known"),
    );
    if (idx === -1) continue;
    const values = rows.slice(0, 20).map((row) => {
      const cell = row[idx];
      if (typeof cell === "number") return cell;
      if (typeof cell === "string") {
        const n = parseInt(cell, 10);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    });
    if (values.length > 0) return values;
  }
  return undefined;
}

function extractSpellsKnownFixed(
  raw: RawClassDefinition,
): number[] | undefined {
  return extractSpellsKnownFromTableGroups(raw.classTableGroups);
}

function mapTableGroup(group: RawClassTableGroup): ClassTableGroup {
  const rows = group.rows ?? group.rowsSpellProgression ?? [];
  return {
    title: group.title,
    colLabels: (group.colLabels ?? []).map((label) =>
      parseFiveToolsMarkup(String(label)),
    ),
    rows: rows.map((row) => row.map((cell) => formatCellValue(cell))),
  };
}

function buildTableCellsForLevel(
  groups: ClassTableGroup[],
  levelIndex: number,
): string[] {
  const cells: string[] = [];
  for (const group of groups) {
    const row = group.rows[levelIndex];
    if (row) cells.push(...row);
  }
  return cells;
}

function mapProgression(
  featuresByLevel: ResolvedFeature[][] | undefined,
  tableGroups: ClassTableGroup[],
): ClassLevelRow[] {
  return Array.from({ length: 20 }, (_, i) => {
    const level = i + 1;
    const features = (featuresByLevel?.[i] ?? []).map((f) =>
      mapFeatureEntry(f),
    );
    return {
      level,
      features,
      tableCells: buildTableCellsForLevel(tableGroups, i),
    };
  });
}

function titleCaseProficiency(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatProficiencyLabel(value: string): string {
  return value.includes("{@") ? parseFiveToolsMarkup(value) : titleCaseProficiency(value);
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

function mapStartingProficiencies(raw?: RawStartingProficiencies): ClassMetaListGroup[] {
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

function mapStartingEquipment(raw?: RawStartingEquipment): string[] {
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

function mapMulticlassing(raw?: RawMulticlassing): string[] {
  if (!raw) return [];
  const lines: string[] = [];

  if (raw.requirements) {
    const reqs = Object.entries(raw.requirements)
      .map(([ab, val]) => `${formatAbility(ab)} ${val}`)
      .join(", ");
    lines.push(`Requirements: ${reqs}`);
  }

  const gained = mapStartingProficiencies(raw.proficienciesGained);
  if (gained.length) {
    const summary = gained
      .map((group) => `${group.label}: ${group.items.join(", ")}`)
      .join("; ");
    lines.push(`Proficiencies gained: ${summary}`);
  }

  return lines;
}

function mapMulticlassRequirements(
  raw?: RawMulticlassing,
): Partial<Record<AbilityKey, number>> | undefined {
  if (!raw?.requirements) return undefined;
  const result: Partial<Record<AbilityKey, number>> = {};
  for (const [ab, val] of Object.entries(raw.requirements)) {
    const key = ab.toLowerCase() as AbilityKey;
    if (key in ABILITY_LABELS) result[key] = val;
  }
  return Object.keys(result).length ? result : undefined;
}

function mapMulticlassProficiencyGrants(
  raw: RawMulticlassing | undefined,
  classSource: import("@/shared/types/proficiency.types").ProficiencySource,
) {
  if (!raw?.proficienciesGained) return undefined;
  const gained = raw.proficienciesGained;
  const armorGrants = parseNamedProficiencyBlocks(
    gained.armor ?? [],
    classSource,
  );
  const weaponGrants = parseNamedProficiencyBlocks(
    gained.weapons ?? [],
    classSource,
  );
  const toolBlocks = [
    ...(gained.toolProficiencies ?? []),
    ...(gained.tools ?? []),
  ];
  const toolGrants = parseNamedProficiencyBlocks(toolBlocks, classSource);
  const skillChoiceGrants = parseSkillProficiencyBlocks(
    gained.skills ?? [],
    classSource,
  );
  if (
    !armorGrants.length &&
    !weaponGrants.length &&
    !toolGrants.length &&
    !skillChoiceGrants.length
  ) {
    return undefined;
  }
  return { armorGrants, weaponGrants, toolGrants, skillChoiceGrants };
}

function mapAdditionalSpells(
  blocks?: SubclassSpellBlockRaw[],
): SubclassSpellBlock[] | undefined {
  if (!blocks?.length) return undefined;
  return blocks.map((block) => ({
    prepared: block.prepared,
    known: block.known,
    expanded: block.expanded,
  }));
}

function mapSubclass(
  sc: ProcessedSubclass,
  allClassFeatures: import("../utils/class-raw.types").RawClassFeature[],
  allSubclassFeatures: import("../utils/class-raw.types").RawSubclassFeature[],
): Subclass {
  const tableGroups = (sc.subclassTableGroups ?? []).map(mapTableGroup);
  const baseProgressions = mergeOptionalFeatureProgressions(
    sc.optionalfeatureProgression,
    sc.featProgression,
    "subclass",
    sc.name,
    sc.source,
  );
  const optionalProgressionNames = [
    ...(sc.optionalfeatureProgression ?? []).map((p) => p.name ?? ""),
    ...(sc.featProgression ?? []).map((p) => p.name ?? ""),
  ];
  const featureChoices = extractSubclassFeatureChoiceProgressions(
    sc.name,
    sc.source,
    sc.className,
    sc.classSource || DEFAULT_CLASS_SOURCE,
    sc.shortName,
    allClassFeatures,
    allSubclassFeatures,
    optionalProgressionNames,
  );

  return {
    id: classId(sc.name, sc.source),
    name: sc.name,
    shortName: sc.shortName,
    source: sc.source,
    classSource: sc.classSource || DEFAULT_CLASS_SOURCE,
    edition: sc.edition,
    page: sc.page,
    progression: mapProgression(sc.subclassFeaturesByLevel, tableGroups),
    casterProgression: sc.casterProgression,
    spellcastingAbility: sc.spellcastingAbility
      ? formatAbility(sc.spellcastingAbility)
      : undefined,
    cantripProgression: sc.cantripProgression,
    preparedSpells: sc.preparedSpells,
    preparedSpellsProgression: sc.preparedSpellsProgression,
    spellsKnownProgressionFixed:
      sc.spellsKnownProgression ??
      extractSpellsKnownFromTableGroups(sc.subclassTableGroups),
    spellProgression: tableGroups.length ? tableGroups : undefined,
    additionalSpells: mapAdditionalSpells(sc.additionalSpells),
    optionalFeatureProgressions: mergeFeatureChoiceProgressions(
      baseProgressions,
      featureChoices,
    ),
  };
}

function formatHitDie(raw: RawClassDefinition): string {
  if (raw.hd?.faces) return `d${raw.hd.faces}`;
  if (raw.isSidekick) return "Sidekick";
  return "—";
}

export function mapClass(
  raw: RawClassDefinition,
  allClassFeatures: import("../utils/class-raw.types").RawClassFeature[] = [],
  allSubclassFeatures: import("../utils/class-raw.types").RawSubclassFeature[] = [],
): Class {
  const spellProgression = (raw.classTableGroups ?? []).map(mapTableGroup);
  const proficiencies = (raw.proficiency ?? []).map(formatAbility);
  const hitDie = formatHitDie(raw);

  const progression = mapProgression(raw.classFeaturesByLevel, spellProgression);

  const subclasses = (raw.subclasses ?? []).map((sc) =>
    mapSubclass(sc as ProcessedSubclass, allClassFeatures, allSubclassFeatures),
  );

  const baseClassProgressions = mergeOptionalFeatureProgressions(
    raw.optionalfeatureProgression,
    raw.featProgression,
    "class",
    raw.name,
    raw.source,
  );
  const classOptionalProgressionNames = [
    ...(raw.optionalfeatureProgression ?? []).map((p) => p.name ?? ""),
    ...(raw.featProgression ?? []).map((p) => p.name ?? ""),
  ];
  const classFeatureChoices = extractClassFeatureChoiceProgressions(
    raw.name,
    raw.source,
    allClassFeatures,
    allSubclassFeatures,
    classOptionalProgressionNames,
  );

  const casterLabel = raw.casterProgression
    ? (CASTER_LABELS[raw.casterProgression] ?? raw.casterProgression)
    : "None";

  const summaryParts = [
    raw.name,
    hitDie,
    casterLabel,
    ...subclasses.map((s) => s.name),
  ];

  const classSource: import("@/shared/types/proficiency.types").ProficiencySource = {
    type: "class",
    name: raw.name,
  };
  const saveProfGrant = parseSaveProficiencies(raw.proficiency ?? [], classSource);
  const skillChoiceGrants = parseSkillProficiencyBlocks(
    raw.startingProficiencies?.skills ?? [],
    classSource,
  );
  const toolBlocks = [
    ...(raw.startingProficiencies?.toolProficiencies ?? []),
    ...(raw.startingProficiencies?.tools ?? []),
  ];
  const toolGrants = parseNamedProficiencyBlocks(toolBlocks, classSource);
  const armorGrants = parseNamedProficiencyBlocks(
    raw.startingProficiencies?.armor ?? [],
    classSource,
  );
  const weaponGrants = parseNamedProficiencyBlocks(
    raw.startingProficiencies?.weapons ?? [],
    classSource,
  );
  const languageGrants = parseNamedProficiencyBlocks(
    raw.startingProficiencies?.languages ?? [],
    classSource,
  );

  return {
    id: classId(raw.name, raw.source),
    name: raw.name,
    source: raw.source,
    page: raw.page,
    edition: raw.edition,
    isSidekick: raw.isSidekick,
    hitDie,
    proficiencies,
    casterProgression: raw.casterProgression,
    spellcastingAbility: raw.spellcastingAbility
      ? formatAbility(raw.spellcastingAbility)
      : undefined,
    cantripProgression: raw.cantripProgression,
    preparedSpells: raw.preparedSpells,
    preparedSpellsProgression: raw.preparedSpellsProgression,
    spellsKnownProgressionFixed: extractSpellsKnownFixed(raw),
    spellProgression,
    progression,
    subclasses,
    startingProficiencies: mapStartingProficiencies(raw.startingProficiencies),
    startingEquipment: mapStartingEquipment(raw.startingEquipment),
    startingEquipmentOffers: parseClassStartingEquipment(raw.startingEquipment),
    multiclassing: mapMulticlassing(raw.multiclassing),
    multiclassRequirements: mapMulticlassRequirements(raw.multiclassing),
    multiclassProficiencies: mapMulticlassProficiencyGrants(
      raw.multiclassing,
      classSource,
    ),
    subclassTitle: raw.subclassTitle,
    summary: summaryParts.join(" "),
    saveProficiencies: saveProfGrant?.abilities ?? [],
    skillChoiceGrants,
    toolGrants,
    armorGrants,
    weaponGrants,
    languageGrants,
    optionalFeatureProgressions: mergeFeatureChoiceProgressions(
      baseClassProgressions,
      classFeatureChoices,
    ),
  };
}

export function getCasterLabel(casterProgression?: string): string {
  if (!casterProgression) return "None";
  return CASTER_LABELS[casterProgression] ?? casterProgression;
}

/** Merge class and subclass features for the level table display */
export function mergeProgressionWithSubclass(
  classProgression: ClassLevelRow[],
  subclass: Subclass | null,
): ClassLevelRow[] {
  if (!subclass) return classProgression;

  return classProgression.map((row, i) => {
    const subclassFeatures = (subclass.progression[i]?.features ?? []).map(
      (f) => ({ ...f, isSubclassFeature: true }),
    );

    const classFeatures = row.features.filter((f) => !f.gainSubclassFeature);
    const placeholders = row.features.filter((f) => f.gainSubclassFeature);

    const mergedFeatures: ClassFeatureEntry[] = [
      ...classFeatures,
      ...subclassFeatures,
      ...placeholders.map((f) => ({
        ...f,
        displayName: subclass.name,
      })),
    ];

    return {
      ...row,
      features: mergedFeatures,
    };
  });
}
