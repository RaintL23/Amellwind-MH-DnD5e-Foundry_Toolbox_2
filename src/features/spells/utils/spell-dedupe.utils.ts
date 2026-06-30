import { Spell } from "@/shared/types";
import { SPELL_SOURCE_FILES } from "@/shared/constants/api.constants";
import { dedupeByNameWithVariants } from "@/shared/utils/dedupe-by-name.utils";

/** Preferencia al elegir la fila visible en la lista */
const CANONICAL_SOURCE_PRIORITY = [
  ...new Set([
    "XPHB",
    "PHB",
    ...Object.keys(SPELL_SOURCE_FILES),
  ]),
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
    }),
  });
}

export function getSpellsByName(spells: Spell[], name: string): Spell[] {
  return spells
    .filter((s) => s.name === name)
    .sort((a, b) => a.source.localeCompare(b.source));
}
