import { Class } from "@/shared/types";
import { getCasterLabel } from "../mappers/class.mapper";

const CANONICAL_SOURCE_PRIORITY = ["XPHB", "PHB", "TCE", "XGE", "SCAG", "EGW"];

function sourcePriority(source: string): number {
  const index = CANONICAL_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? CANONICAL_SOURCE_PRIORITY.length : index;
}

function pickCanonicalClass(group: Class[]): Class {
  return [...group].sort((a, b) => {
    const bySource = sourcePriority(a.source) - sourcePriority(b.source);
    if (bySource !== 0) return bySource;
    return a.source.localeCompare(b.source);
  })[0];
}

function buildSearchText(group: Class[]): string {
  const parts: string[] = [];
  for (const cls of group) {
    parts.push(
      cls.name,
      cls.summary,
      cls.source,
      cls.hitDie,
      getCasterLabel(cls.casterProgression),
      ...cls.subclasses.map((s) => s.name),
    );
  }
  return parts.join(" ").toLowerCase();
}

export function dedupeClassesByName(classes: Class[]): Class[] {
  const byName = new Map<string, Class[]>();

  for (const cls of classes) {
    const group = byName.get(cls.name) ?? [];
    group.push(cls);
    byName.set(cls.name, group);
  }

  return Array.from(byName.values()).map((group) => {
    const canonical = pickCanonicalClass(group);
    const variantSources = [...new Set(group.map((c) => c.source))].sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      ...canonical,
      variantCount: group.length,
      variantSources,
      searchText: buildSearchText(group),
      /** Only the canonical variant's subclasses (PHB ≠ XPHB); searchText still indexes all */
      subclasses: canonical.subclasses,
    };
  });
}

export function getClassesByName(classes: Class[], name: string): Class[] {
  return classes
    .filter((c) => c.name === name)
    .sort((a, b) => {
      const byPriority = sourcePriority(a.source) - sourcePriority(b.source);
      if (byPriority !== 0) return byPriority;
      return a.source.localeCompare(b.source);
    });
}

export function sortClassVariants(classes: Class[]): Class[] {
  return [...classes].sort((a, b) => {
    const byPriority = sourcePriority(a.source) - sourcePriority(b.source);
    if (byPriority !== 0) return byPriority;
    return a.source.localeCompare(b.source);
  });
}
