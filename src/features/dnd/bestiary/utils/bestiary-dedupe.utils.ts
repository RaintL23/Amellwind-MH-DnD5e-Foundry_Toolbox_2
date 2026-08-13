import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { DEFAULT_BESTIARY_SOURCES } from "@/shared/constants/api.constants";

const CANONICAL_SOURCE_PRIORITY = [
  ...new Set([
    "XMM",
    "MPMM",
    "MM",
    "VGM",
    ...DEFAULT_BESTIARY_SOURCES,
  ]),
];

function sourcePriority(source: string): number {
  const index = CANONICAL_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? CANONICAL_SOURCE_PRIORITY.length : index;
}

function pickCanonicalCreature(group: BestiaryCreature[]): BestiaryCreature {
  return [...group].sort((a, b) => {
    const bySource = sourcePriority(a.source) - sourcePriority(b.source);
    if (bySource !== 0) return bySource;
    return a.source.localeCompare(b.source);
  })[0];
}

function buildSearchText(group: BestiaryCreature[]): string {
  const parts: string[] = [];
  for (const c of group) {
    parts.push(
      c.name,
      c.cr,
      c.crDisplay,
      c.size,
      c.type.type,
      ...(c.type.tags ?? []),
      c.source,
      ...(c.environment ?? []),
      ...(c.group ?? []),
    );
  }
  return parts.join(" ").toLowerCase();
}

export function dedupeCreaturesByName(creatures: BestiaryCreature[]): BestiaryCreature[] {
  const byName = new Map<string, BestiaryCreature[]>();

  for (const creature of creatures) {
    const group = byName.get(creature.name) ?? [];
    group.push(creature);
    byName.set(creature.name, group);
  }

  return Array.from(byName.values()).map((group) => {
    const canonical = pickCanonicalCreature(group);
    const variantSources = [...new Set(group.map((c) => c.source))].sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      ...canonical,
      variantCount: group.length,
      variantSources,
      searchText: buildSearchText(group),
    };
  });
}

export function getCreaturesByName(
  creatures: BestiaryCreature[],
  name: string,
): BestiaryCreature[] {
  return creatures
    .filter((c) => c.name === name)
    .sort((a, b) => a.source.localeCompare(b.source));
}

export function collectCreatureSources(creatures: BestiaryCreature[]): string[] {
  const sources = new Set<string>();
  for (const c of creatures) {
    for (const s of c.variantSources ?? [c.source]) sources.add(s);
  }
  return Array.from(sources).sort((a, b) => a.localeCompare(b));
}
