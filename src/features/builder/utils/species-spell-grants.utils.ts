import type { BuilderSpellSelection, DndRace, Spell } from "@/shared/types";
import type { SpeciesNamedSpellGroup } from "@/shared/types/dnd-race.types";
import { getSpellsByName } from "@/features/spells/services/spell.service";
import { normalizeSpellRef } from "./subclass-spells.utils";

export const SPECIES_LINEAGE_SPELL_SOURCE = "species-lineage";

function toSpellId(name: string): string {
  return normalizeSpellRef(name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function resolveActiveSpellGroup(
  race: DndRace,
  choice: string | null,
): SpeciesNamedSpellGroup | null {
  if (!race.namedSpellGroups?.length || !choice) return null;
  return (
    race.namedSpellGroups.find(
      (group) => group.name.toLowerCase() === choice.toLowerCase(),
    ) ?? null
  );
}

function resolveSpellLevel(spellName: string, spells: Spell[]): number {
  const normalized = normalizeSpellRef(spellName).toLowerCase();
  const match =
    spells.find((spell) => spell.name.toLowerCase() === normalized) ??
    spells[0];
  return match?.level ?? 1;
}

function makeSelection(
  name: string,
  level: number,
  school?: string,
): BuilderSpellSelection {
  return {
    id: `species-lineage-${toSpellId(name)}`,
    name: normalizeSpellRef(name),
    level,
    source: SPECIES_LINEAGE_SPELL_SOURCE,
    school,
  };
}

export async function buildSpeciesLineageSpellSelections(
  race: DndRace,
  choice: string | null,
  characterLevel: number,
): Promise<BuilderSpellSelection[]> {
  const group = resolveActiveSpellGroup(race, choice);
  const selections: BuilderSpellSelection[] = [];
  const seen = new Set<string>();

  const pushSelection = (selection: BuilderSpellSelection) => {
    if (seen.has(selection.id)) return;
    seen.add(selection.id);
    selections.push(selection);
  };

  for (const cantripName of race.universalCantrips ?? []) {
    pushSelection(makeSelection(cantripName, 0));
  }

  if (!group) return selections;

  for (const cantripName of group.cantrips) {
    pushSelection(makeSelection(cantripName, 0));
  }

  for (const grant of group.innateSpells ?? []) {
    if (characterLevel < grant.unlockedAtCharacterLevel) continue;
    const spells = await getSpellsByName(grant.name);
    const level = resolveSpellLevel(grant.name, spells);
    const school = spells[0]?.schoolName;
    pushSelection(makeSelection(grant.name, level, school));
  }

  return selections;
}

export function buildSpeciesLineageSpellSelectionsFromCatalog(
  race: DndRace,
  choice: string | null,
  characterLevel: number,
  allSpells: Spell[],
): BuilderSpellSelection[] {
  const group = resolveActiveSpellGroup(race, choice);
  const selections: BuilderSpellSelection[] = [];
  const seen = new Set<string>();

  const pushSelection = (selection: BuilderSpellSelection) => {
    if (seen.has(selection.id)) return;
    seen.add(selection.id);
    selections.push(selection);
  };

  const lookupByName = new Map<string, Spell>();
  for (const spell of allSpells) {
    lookupByName.set(spell.name.toLowerCase(), spell);
  }

  const resolveFromCatalog = (spellName: string): Spell | undefined => {
    const normalized = normalizeSpellRef(spellName).toLowerCase();
    return lookupByName.get(normalized);
  };

  for (const cantripName of race.universalCantrips ?? []) {
    const spell = resolveFromCatalog(cantripName);
    pushSelection(
      makeSelection(cantripName, 0, spell?.schoolName),
    );
  }

  if (!group) return selections;

  for (const cantripName of group.cantrips) {
    const spell = resolveFromCatalog(cantripName);
    pushSelection(
      makeSelection(cantripName, 0, spell?.schoolName),
    );
  }

  for (const grant of group.innateSpells ?? []) {
    if (characterLevel < grant.unlockedAtCharacterLevel) continue;
    const spell = resolveFromCatalog(grant.name);
    const level = spell?.level ?? 1;
    pushSelection(makeSelection(grant.name, level, spell?.schoolName));
  }

  return selections;
}
