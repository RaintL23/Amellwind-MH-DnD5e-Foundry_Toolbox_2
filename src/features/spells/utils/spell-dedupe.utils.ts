import { Spell } from "@/shared/types";
import { dedupeByNameWithVariants } from "@/shared/utils/dedupe-by-name.utils";

/** Preferencia al elegir la fila visible en la lista */
const CANONICAL_SOURCE_PRIORITY = [
  "XPHB",
  "PHB",
  "XGE",
  "TCE",
  "EGW",
  "FTD",
  "GGR",
];

function mergeClassNames(group: Spell[]): string[] {
  const names = new Set<string>();
  for (const spell of group) {
    for (const name of spell.classNames) names.add(name);
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function mergeClassLabels(group: Spell[]): string[] {
  const labels = new Set<string>();
  for (const spell of group) {
    for (const label of spell.classes) labels.add(label);
  }
  return Array.from(labels).sort((a, b) => a.localeCompare(b));
}

function mergeStringLists(group: Spell[], pick: (s: Spell) => string[]): string[] {
  const values = new Set<string>();
  for (const spell of group) {
    for (const value of pick(spell)) values.add(value);
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

function buildSearchText(group: Spell[]): string {
  const parts: string[] = [];
  for (const spell of group) {
    parts.push(
      spell.name,
      spell.summary,
      spell.schoolName,
      spell.source,
      ...spell.classNames,
      ...spell.classes,
      ...spell.filterTags,
      ...spell.damageTypes,
    );
  }
  return parts.join(" ").toLowerCase();
}

/**
 * Una fila por nombre de hechizo. Metadatos de variantes para filtros y diálogo.
 */
export function dedupeSpellsByName(spells: Spell[]): Spell[] {
  return dedupeByNameWithVariants(spells, {
    sourcePriority: CANONICAL_SOURCE_PRIORITY,
    buildSearchText,
    mergeExtra: (group) => ({
      classNames: mergeClassNames(group),
      classes: mergeClassLabels(group),
      filterTags: mergeStringLists(group, (s) => s.filterTags),
      damageTypes: mergeStringLists(group, (s) => s.damageTypes),
      conditions: mergeStringLists(group, (s) => s.conditions),
      spellAttack: mergeStringLists(group, (s) => s.spellAttack),
      savingThrows: mergeStringLists(group, (s) => s.savingThrows),
      castTimeUnits: mergeStringLists(group, (s) => s.castTimeUnits),
      areaStyles: mergeStringLists(group, (s) => s.areaStyles),
      // Prefer primary variant's buckets; union not meaningful for single-select semantics
      durationBucket: group[0]?.durationBucket ?? "Special",
      rangeBucket: group[0]?.rangeBucket ?? "Special",
    }),
  });
}

export function getSpellsByName(spells: Spell[], name: string): Spell[] {
  return spells
    .filter((s) => s.name === name)
    .sort((a, b) => a.source.localeCompare(b.source));
}
