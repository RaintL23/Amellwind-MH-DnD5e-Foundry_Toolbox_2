import type { DndRace, Species } from "@/shared/types";
import { getSpeciesById } from "@/features/amellwind/species/services/species.service";
import { getDndRaceById } from "@/features/dnd/races/services/dnd-race.service";

/** A species selection reference with at least an id and optional subrace id. */
export interface SpeciesResolutionRef {
  id: string;
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
  /** Amellwind subspecies entry (only when a subraceId is selected for an MH species). */
  mhSubrace: Species | undefined;
  /** Preferred base entry: MH species takes precedence over the D&D race. */
  base: Species | DndRace | undefined;
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

  return {
    mhSpecies,
    dndRace,
    dndSubrace,
    mhSubrace,
    base: mhSpecies ?? dndRace,
  };
}
