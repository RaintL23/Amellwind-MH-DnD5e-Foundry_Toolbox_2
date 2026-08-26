import type { BuilderSpellSelection, DndRace, Spell, Species } from "@/shared/types";
import type { SpeciesNamedSpellGroup } from "@/shared/types/dnd-race.types";
import { getSpellsByName } from "@/features/dnd/spells/services/spell.service";
import { normalizeSpellRef } from "./subclass-spells.utils";

export const SPECIES_LINEAGE_SPELL_SOURCE = "species-lineage";

export interface SpeciesSpellGrantSource {
  universalCantrips?: string[];
  namedSpellGroups?: SpeciesNamedSpellGroup[];
}

export function combineSpeciesSpellGrantSource(
  base: Species | DndRace | undefined,
  subrace: Species | DndRace | null | undefined,
): SpeciesSpellGrantSource | null {
  if (!base && !subrace) return null;
  const root = base ?? subrace!;
  const variant = subrace ?? null;
  const groups =
    variant?.namedSpellGroups && variant.namedSpellGroups.length > 0
      ? variant.namedSpellGroups
      : root.namedSpellGroups;

  return {
    universalCantrips: [
      ...(root.universalCantrips ?? []),
      ...(variant?.universalCantrips ?? []),
    ],
    namedSpellGroups: groups,
  };
}

export function isSpeciesLineageSpell(
  selection: Pick<BuilderSpellSelection, "id" | "source">,
): boolean {
  return (
    selection.source === SPECIES_LINEAGE_SPELL_SOURCE ||
    selection.id.startsWith("species-lineage-")
  );
}

export function partitionSpellSelections(
  selections: BuilderSpellSelection[] | undefined,
): {
  speciesLineage: BuilderSpellSelection[];
  chosen: BuilderSpellSelection[];
} {
  const speciesLineage: BuilderSpellSelection[] = [];
  const chosen: BuilderSpellSelection[] = [];
  for (const selection of selections ?? []) {
    if (isSpeciesLineageSpell(selection)) {
      speciesLineage.push(selection);
    } else {
      chosen.push(selection);
    }
  }
  return { speciesLineage, chosen };
}

function toSpellId(name: string): string {
  return normalizeSpellRef(name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function resolveActiveSpellGroup(
  source: SpeciesSpellGrantSource,
  choice: string | null,
): SpeciesNamedSpellGroup | null {
  if (!source.namedSpellGroups?.length) return null;
  if (source.namedSpellGroups.length === 1) {
    return source.namedSpellGroups[0] ?? null;
  }
  if (!choice) return null;
  return (
    source.namedSpellGroups.find(
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
  source: SpeciesSpellGrantSource,
  choice: string | null,
  characterLevel: number,
): Promise<BuilderSpellSelection[]> {
  const group = resolveActiveSpellGroup(source, choice);
  const selections: BuilderSpellSelection[] = [];
  const seen = new Set<string>();

  const pushSelection = (selection: BuilderSpellSelection) => {
    if (seen.has(selection.id)) return;
    seen.add(selection.id);
    selections.push(selection);
  };

  for (const cantripName of source.universalCantrips ?? []) {
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

/** @deprecated Use {@link buildSpeciesLineageSpellSelections} with a spell grant source. */
export async function buildSpeciesLineageSpellSelectionsForRace(
  race: DndRace,
  choice: string | null,
  characterLevel: number,
): Promise<BuilderSpellSelection[]> {
  return buildSpeciesLineageSpellSelections(
    {
      universalCantrips: race.universalCantrips,
      namedSpellGroups: race.namedSpellGroups,
    },
    choice,
    characterLevel,
  );
}

export function buildSpeciesLineageSpellSelectionsFromCatalog(
  source: SpeciesSpellGrantSource,
  choice: string | null,
  characterLevel: number,
  allSpells: Spell[],
): BuilderSpellSelection[] {
  const group = resolveActiveSpellGroup(source, choice);
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

  for (const cantripName of source.universalCantrips ?? []) {
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

export function speciesSpellGrantSourceHasSpells(
  source: SpeciesSpellGrantSource | null | undefined,
): boolean {
  if (!source) return false;
  if (source.universalCantrips?.length) return true;
  return (source.namedSpellGroups ?? []).some(
    (group) =>
      group.cantrips.length > 0 || (group.innateSpells?.length ?? 0) > 0,
  );
}

export interface SpeciesLineageSpellGrantPreview {
  name: string;
  /** Spell level (0 = cantrip) when known; null if catalog not loaded. */
  spellLevel: number | null;
  unlockedAtCharacterLevel: number;
  unlocked: boolean;
}

/** All lineage grants for UI (includes locked future unlocks). */
export function listSpeciesLineageSpellGrantPreviews(
  source: SpeciesSpellGrantSource,
  choice: string | null,
  characterLevel: number,
  allSpells?: Spell[],
): SpeciesLineageSpellGrantPreview[] {
  const group = resolveActiveSpellGroup(source, choice);
  const previews: SpeciesLineageSpellGrantPreview[] = [];
  const seen = new Set<string>();

  const lookup = new Map<string, Spell>();
  for (const spell of allSpells ?? []) {
    lookup.set(spell.name.toLowerCase(), spell);
  }

  const push = (
    name: string,
    unlockedAtCharacterLevel: number,
    fallbackSpellLevel: number | null,
  ) => {
    const key = normalizeSpellRef(name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const spell = lookup.get(key);
    previews.push({
      name: normalizeSpellRef(name),
      spellLevel: spell?.level ?? fallbackSpellLevel,
      unlockedAtCharacterLevel,
      unlocked: characterLevel >= unlockedAtCharacterLevel,
    });
  };

  for (const cantripName of source.universalCantrips ?? []) {
    push(cantripName, 1, 0);
  }
  if (!group) return previews;

  for (const cantripName of group.cantrips) {
    push(cantripName, 1, 0);
  }
  for (const grant of group.innateSpells ?? []) {
    push(grant.name, grant.unlockedAtCharacterLevel, null);
  }

  return previews.sort((a, b) => {
    if (a.unlockedAtCharacterLevel !== b.unlockedAtCharacterLevel) {
      return a.unlockedAtCharacterLevel - b.unlockedAtCharacterLevel;
    }
    return a.name.localeCompare(b.name);
  });
}
