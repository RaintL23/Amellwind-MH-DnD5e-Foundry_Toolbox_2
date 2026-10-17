import { Species, SpeciesCategory } from "@/shared/types";
import { getRacesRaw } from "@/shared/db/sync.service";
import { createEntityService } from "@/shared/services/create-entity-service";
import { mapSpecies } from "../mappers/species.mapper";

type RawSpeciesEntry = unknown;

const service = createEntityService<RawSpeciesEntry, Species>({
  loadRaw: async () => (await getRacesRaw()) as unknown[],
  map: (raw) => mapSpecies(raw),
  idOf: (species) => species.id,
});

export const getAllSpecies = service.getAll;
export const getSpeciesById = service.getById;
export const clearSpeciesCache = service.clearCache;

export async function getSpeciesByName(name: string): Promise<Species[]> {
  const all = await service.getAll();
  return all.filter((s) => s.name.toLowerCase() === name.toLowerCase());
}

export async function getSpeciesByCategory(
  category: SpeciesCategory,
): Promise<Species[]> {
  const all = await service.getAll();
  return all.filter((s) => s.category === category);
}

export async function getSubracesOf(parentName: string): Promise<Species[]> {
  const all = await service.getAll();
  return all.filter(
    (s) => s.parentSpecies?.toLowerCase() === parentName.toLowerCase(),
  );
}

/** Amellwind subspecies attached to a given parent (e.g. Elder Dragonborn → Dragonborn|PHB). */
export async function getSubracesOfParent(
  parentName: string,
  parentSource: string,
): Promise<Species[]> {
  const all = await service.getAll();
  const name = parentName.toLowerCase();
  const source = parentSource.toLowerCase();
  return all.filter(
    (s) =>
      s.isSubrace &&
      s.parentSpecies?.toLowerCase() === name &&
      (s.parentSource ?? "").toLowerCase() === source,
  );
}

export async function getRootSpecies(): Promise<Species[]> {
  const all = await service.getAll();
  return all.filter((s) => !s.isSubrace);
}
