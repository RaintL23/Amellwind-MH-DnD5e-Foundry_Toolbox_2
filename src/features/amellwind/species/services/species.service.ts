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

export async function getRootSpecies(): Promise<Species[]> {
  const all = await service.getAll();
  return all.filter((s) => !s.isSubrace);
}
