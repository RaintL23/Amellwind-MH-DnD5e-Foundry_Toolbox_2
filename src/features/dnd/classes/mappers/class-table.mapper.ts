import type {
  ClassFeatureEntry,
  ClassLevelRow,
  ClassTableGroup,
} from "@/shared/types";
import { ABILITY_NAMES } from "@/shared/constants/dnd";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  mapStatBlockEntries,
  statBlockContentToPlainText,
} from "@/shared/utils/statblock-entries.mapper";
import {
  extractFeatRefs,
  extractOptionalFeatureRefs,
} from "../utils/optional-feature-progression.utils";
import type {
  ClassTableCell,
  RawClassTableGroup,
  ResolvedFeature,
} from "../utils/class-raw.types";

const ABILITY_LABELS: Record<string, string> = ABILITY_NAMES;

export function classId(name: string, source: string): string {
  return `${source}::${name}`;
}

export function formatAbility(ab: string): string {
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

export function mapFeatureEntry(
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
    rawEntries: Array.isArray(feature.entries) ? feature.entries : undefined,
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
export function extractSpellsKnownFromTableGroups(
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

export function extractSpellsKnownFixed(raw: {
  classTableGroups?: RawClassTableGroup[];
}): number[] | undefined {
  return extractSpellsKnownFromTableGroups(raw.classTableGroups);
}

export function mapTableGroup(group: RawClassTableGroup): ClassTableGroup {
  const rows = group.rows ?? group.rowsSpellProgression ?? [];
  return {
    title: group.title,
    colLabels: (group.colLabels ?? []).map((label) =>
      parseFiveToolsMarkup(String(label)),
    ),
    rows: rows.map((row) => row.map((cell) => formatCellValue(cell))),
  };
}

export function buildTableCellsForLevel(
  groups: ClassTableGroup[],
  levelIndex: number,
): string[] {
  const cells: string[] = [];
  for (const group of groups) {
    const row = group.rows[levelIndex];
    if (row) {
      cells.push(...row);
    } else {
      cells.push(...group.colLabels.map(() => "—"));
    }
  }
  return cells;
}

/** Standard D&D proficiency bonus by character level (1–20). */
export function proficiencyBonusAtLevel(level: number): number {
  if (level < 1) return 2;
  return Math.min(6, 2 + Math.floor((level - 1) / 4));
}

export function buildProficiencyBonusTableGroup(): ClassTableGroup {
  return {
    colLabels: ["Proficiency Bonus"],
    rows: Array.from({ length: 20 }, (_, i) => [
      `+${proficiencyBonusAtLevel(i + 1)}`,
    ]),
  };
}

export function mapProgression(
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

export function progressionFromTableColumn(
  tableGroups: RawClassTableGroup[],
): Record<string, number> | null {
  for (const group of tableGroups) {
    const colLabels = group.colLabels ?? [];
    const idx = colLabels.findIndex(
      (l) =>
        typeof l === "string" &&
        l.toLowerCase().replace(/\s+/g, " ").includes("weapon mastery"),
    );
    if (idx === -1) continue;

    const rows = group.rows ?? group.rowsSpellProgression ?? [];
    const progression: Record<string, number> = {};
    let prev = 0;

    for (let i = 0; i < rows.length && i < 20; i++) {
      const cell = rows[i]?.[idx];
      const val =
        typeof cell === "number"
          ? cell
          : typeof cell === "string"
            ? parseInt(cell, 10)
            : NaN;
      if (!Number.isNaN(val) && val > prev) {
        progression[String(i + 1)] = val;
        prev = val;
      }
    }

    if (Object.keys(progression).length > 0) return progression;
  }

  return null;
}
