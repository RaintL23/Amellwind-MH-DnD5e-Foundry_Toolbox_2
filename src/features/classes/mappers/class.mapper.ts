import type {
  Class,
  ClassFeatureEntry,
  ClassLevelRow,
  ClassTableGroup,
  Subclass,
  SubclassSpellBlock,
} from "@/shared/types";
import {
  parseEntries,
  parseFiveToolsMarkup,
} from "@/shared/utils/fivetools-parser";
import { DEFAULT_CLASS_SOURCE } from "../utils/class-raw.types";
import type {
  ProcessedSubclass,
  RawClassDefinition,
  RawClassTableGroup,
  RawMulticlassing,
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
  none: "None",
};

export function classId(name: string, source: string): string {
  return `${source}::${name}`;
}

function formatAbility(ab: string): string {
  return ABILITY_LABELS[ab.toLowerCase()] ?? ab.toUpperCase();
}

function parseFeatureDescription(entries: unknown[]): string[] {
  if (!entries.length) return [];
  const text = parseEntries(entries);
  if (!text) return [];
  return text
    .split(/\n|(?<=\.) /)
    .map((line) => line.trim())
    .filter(Boolean);
}

function mapFeatureEntry(
  feature: ResolvedFeature,
  isSubclassFeature = false,
): ClassFeatureEntry {
  const uid = `${feature.name}|${feature.className}|${feature.classSource}|${feature.level}|${feature.source}`;
  return {
    uid,
    name: feature.name,
    displayName: feature.displayName,
    source: feature.source,
    description: parseFeatureDescription(feature.entries),
    isSubclassFeature,
    gainSubclassFeature: feature.gainSubclassFeature,
  };
}

function formatCellValue(value: number | string): string {
  if (typeof value === "number") return value === 0 ? "—" : String(value);
  return parseFiveToolsMarkup(String(value));
}

function mapTableGroup(group: RawClassTableGroup): ClassTableGroup {
  const rows = group.rows ?? group.rowsSpellProgression ?? [];
  return {
    title: group.title,
    colLabels: (group.colLabels ?? []).map((label) =>
      parseFiveToolsMarkup(String(label)),
    ),
    rows: rows.map((row) =>
      row.map((cell) => formatCellValue(cell as number | string)),
    ),
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

function mapStartingProficiencies(raw?: RawStartingProficiencies): string[] {
  if (!raw) return [];
  const lines: string[] = [];

  if (raw.armor?.length) {
    lines.push(`Armor: ${raw.armor.join(", ")}`);
  }
  if (raw.weapons?.length) {
    lines.push(`Weapons: ${raw.weapons.join(", ")}`);
  }
  if (raw.tools?.length) {
    lines.push(`Tools: ${raw.tools.join(", ")}`);
  }
  if (raw.languages?.length) {
    lines.push(`Languages: ${raw.languages.join(", ")}`);
  }
  for (const skill of raw.skills ?? []) {
    if (typeof skill === "string") {
      lines.push(`Skill: ${skill}`);
    } else if (skill.choose?.from?.length) {
      lines.push(
        `Skills: choose ${skill.choose.count ?? 1} from ${skill.choose.from.join(", ")}`,
      );
    }
  }
  return lines;
}

function mapStartingEquipment(raw?: RawStartingEquipment): string[] {
  if (!raw) return [];
  const lines = (raw.default ?? []).map((line) => parseFiveToolsMarkup(line));
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
    lines.push(`Proficiencies gained: ${gained.join("; ")}`);
  }

  return lines;
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

function mapSubclass(sc: ProcessedSubclass): Subclass {
  const tableGroups = (sc.subclassTableGroups ?? []).map(mapTableGroup);
  return {
    id: classId(sc.name, sc.source),
    name: sc.name,
    shortName: sc.shortName,
    source: sc.source,
    classSource: sc.classSource || DEFAULT_CLASS_SOURCE,
    page: sc.page,
    progression: mapProgression(sc.subclassFeaturesByLevel, tableGroups),
    additionalSpells: mapAdditionalSpells(sc.additionalSpells),
  };
}

function formatHitDie(raw: RawClassDefinition): string {
  if (raw.hd?.faces) return `d${raw.hd.faces}`;
  if (raw.isSidekick) return "Sidekick";
  return "—";
}

export function mapClass(raw: RawClassDefinition): Class {
  const spellProgression = (raw.classTableGroups ?? []).map(mapTableGroup);
  const proficiencies = (raw.proficiency ?? []).map(formatAbility);
  const hitDie = formatHitDie(raw);

  const progression = mapProgression(raw.classFeaturesByLevel, spellProgression);

  const subclasses = (raw.subclasses ?? []).map((sc) =>
    mapSubclass(sc as ProcessedSubclass),
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
    spellProgression,
    progression,
    subclasses,
    startingProficiencies: mapStartingProficiencies(raw.startingProficiencies),
    startingEquipment: mapStartingEquipment(raw.startingEquipment),
    multiclassing: mapMulticlassing(raw.multiclassing),
    subclassTitle: raw.subclassTitle,
    summary: summaryParts.join(" "),
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
