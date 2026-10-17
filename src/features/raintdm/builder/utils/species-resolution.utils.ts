import type {
  CharacterSelectionRef,
  DndRace,
  Species,
} from "@/shared/types";
import { SPECIES_CATEGORY_LABELS } from "@/shared/types";
import {
  getAllSpecies,
  getSpeciesById,
  getSpeciesByName,
  getSubracesOf,
} from "@/features/amellwind/species/services/species.service";
import {
  getDndRaceById,
  getDndRacesByName,
} from "@/features/dnd/races/services/dnd-race.service";

/** A species selection reference with at least an id and optional subrace id. */
export interface SpeciesResolutionRef {
  id: string;
  name?: string;
  subraceId?: string | null;
}

/** Resolved species/race lookups for a builder species selection. */
export interface ResolvedSpeciesParts {
  /** Monster Hunter / Amellwind species (if the id matches one). */
  mhSpecies: Species | undefined;
  /** D&D race base entry (if the id matches one). */
  dndRace: DndRace | undefined;
  /** D&D subrace entry (only when a subraceId is selected for a D&D race). */
  dndSubrace: DndRace | undefined;
  /** Amellwind subspecies entry (MH parent, or a D&D parent such as Elder Dragonborn). */
  mhSubrace: Species | undefined;
  /** Preferred base entry: MH species takes precedence over the D&D race. */
  base: Species | DndRace | undefined;
  /**
   * Set when the stored id pointed at an Amellwind subspecies on its own (older
   * builds listed Felyne / Alatreon as roots). Callers should swap to this ref.
   */
  normalizedRef?: CharacterSelectionRef;
}

/** Display name for the Amellwind "Elder Dragonborn" option (PHB Dragonborn + ancestry). */
export const ELDER_DRAGONBORN_SPECIES_NAME = SPECIES_CATEGORY_LABELS["elder-dragon"];

/** Resolves the parent (MH root or D&D race) an Amellwind subspecies belongs to. */
export async function resolveAmellwindSubspeciesParent(
  subspecies: Species,
): Promise<{ mh?: Species; dnd?: DndRace } | null> {
  const parentName = subspecies.parentSpecies;
  if (!parentName) return null;
  const parentSource = subspecies.parentSource?.toLowerCase() ?? null;

  const mhParents = await getSpeciesByName(parentName);
  const mh = mhParents.find(
    (s) =>
      !s.isSubrace &&
      (!parentSource || s.source.toLowerCase() === parentSource),
  );
  if (mh) return { mh };

  const dndParents = await getDndRacesByName(parentName);
  const dnd =
    dndParents.find(
      (r) =>
        r.kind === "species" &&
        (!parentSource || r.source.toLowerCase() === parentSource),
    ) ?? null;
  return dnd ? { dnd } : null;
}

/** Library label for a parent that only exists to host Amellwind subspecies. */
export function amellwindParentDisplayName(
  subspecies: Species,
  parentName: string,
): string {
  return subspecies.category === "elder-dragon"
    ? ELDER_DRAGONBORN_SPECIES_NAME
    : parentName;
}

/**
 * Resolves a species selection against both the MH species catalog and the
 * D&D race catalog (plus the optional subrace). Centralizes the fetch quartet
 * (`getSpeciesById` + `getDndRaceById` + optional subrace from both catalogs)
 * that several builder hooks/utilities rely on, keeping the
 * `mhSpecies ?? dndRace` precedence. MH subraces are also Species entries
 * (stored with `isSubrace: true`), so we check both catalogs for the subrace.
 */
export async function resolveSpeciesParts(
  species: SpeciesResolutionRef,
): Promise<ResolvedSpeciesParts> {
  const [mhSpecies, dndRace, dndSubrace, mhSubrace] = await Promise.all([
    getSpeciesById(species.id),
    getDndRaceById(species.id),
    species.subraceId
      ? getDndRaceById(species.subraceId)
      : Promise.resolve(undefined),
    species.subraceId
      ? getSpeciesById(species.subraceId)
      : Promise.resolve(undefined),
  ]);

  // A subspecies is never a complete species: rebuild parent + subspecies so
  // the parent's traits/ASI/size are not lost (Felyne → Lynian (Felyne)).
  if (mhSpecies?.isSubrace && !species.subraceId) {
    const parent = await resolveAmellwindSubspeciesParent(mhSpecies);
    if (parent) {
      const parentEntry = parent.mh ?? parent.dnd!;
      return {
        mhSpecies: parent.mh,
        dndRace: parent.dnd,
        dndSubrace: undefined,
        mhSubrace: mhSpecies,
        base: parentEntry,
        normalizedRef: {
          id: parentEntry.id,
          name: parent.mh
            ? parent.mh.name
            : amellwindParentDisplayName(mhSpecies, parentEntry.name),
          subraceId: mhSpecies.id,
          subraceName: mhSpecies.name,
        },
      };
    }
  }

  return {
    mhSpecies,
    dndRace,
    dndSubrace,
    mhSubrace,
    base: mhSpecies ?? dndRace,
  };
}

/**
 * True when the selection still needs a subspecies: Amellwind ancestries with
 * subspecies (Lynian, Wyverian) and the Elder Dragonborn option.
 */
export async function isSpeciesSubraceRequired(
  species: SpeciesResolutionRef,
  parts: ResolvedSpeciesParts,
): Promise<boolean> {
  if (parts.mhSubrace || parts.dndSubrace) return false;
  if (parts.mhSpecies && !parts.mhSpecies.isSubrace) {
    return (await getSubracesOf(parts.mhSpecies.name)).length > 0;
  }
  return !!parts.dndRace && species.name === ELDER_DRAGONBORN_SPECIES_NAME;
}

/**
 * Amellwind species library rows: root species only (subspecies are picked
 * inside their parent) plus one row per D&D parent that hosts Amellwind
 * subspecies — e.g. "Elder Dragonborn" → Dragonborn (PHB) + ancestry.
 */
export async function getAmellwindSpeciesLibraryOptions(): Promise<
  { id: string; name: string }[]
> {
  const all = await getAllSpecies();
  const roots = all.filter((s) => !s.isSubrace);
  const rootNames = new Set(roots.map((s) => s.name.toLowerCase()));
  const options = roots.map((s) => ({ id: s.id, name: s.name }));

  const seenParents = new Set<string>();
  for (const sub of all) {
    if (!sub.isSubrace || !sub.parentSpecies) continue;
    if (rootNames.has(sub.parentSpecies.toLowerCase())) continue;
    const key = `${sub.parentSpecies}|${sub.parentSource ?? ""}`.toLowerCase();
    if (seenParents.has(key)) continue;
    seenParents.add(key);
    const parent = await resolveAmellwindSubspeciesParent(sub);
    if (parent?.dnd) {
      options.push({
        id: parent.dnd.id,
        name: amellwindParentDisplayName(sub, parent.dnd.name),
      });
    }
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
