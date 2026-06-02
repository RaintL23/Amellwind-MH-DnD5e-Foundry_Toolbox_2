import { Spell } from "@/shared/types";
import { SPELL_SOURCE_FILES } from "@/shared/constants/api.constants";

/** Preferencia al elegir la fila visible en la lista */
const CANONICAL_SOURCE_PRIORITY = [
  ...new Set([
    "XPHB",
    "PHB",
    ...Object.keys(SPELL_SOURCE_FILES),
  ]),
];

function sourcePriority(source: string): number {
  const index = CANONICAL_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? CANONICAL_SOURCE_PRIORITY.length : index;
}

function pickCanonicalSpell(group: Spell[]): Spell {
  return [...group].sort((a, b) => {
    const bySource = sourcePriority(a.source) - sourcePriority(b.source);
    if (bySource !== 0) return bySource;
    return a.source.localeCompare(b.source);
  })[0];
}

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
  const byName = new Map<string, Spell[]>();

  for (const spell of spells) {
    const group = byName.get(spell.name) ?? [];
    group.push(spell);
    byName.set(spell.name, group);
  }

  return Array.from(byName.values()).map((group) => {
    const canonical = pickCanonicalSpell(group);
    const variantSources = [...new Set(group.map((s) => s.source))].sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      ...canonical,
      classNames: mergeClassNames(group),
      classes: mergeClassLabels(group),
      variantCount: group.length,
      variantSources,
      searchText: buildSearchText(group),
    };
  });
}

export function getSpellsByName(spells: Spell[], name: string): Spell[] {
  return spells
    .filter((s) => s.name === name)
    .sort((a, b) => a.source.localeCompare(b.source));
}
