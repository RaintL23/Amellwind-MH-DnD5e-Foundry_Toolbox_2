import { Species, SpeciesCategory } from "@/shared/types";
import { getRacesRaw } from "@/shared/db/sync.service";
import { mapSpecies } from "../mappers/species.mapper";

let cache: Species[] | null = null;

export async function getAllSpecies(): Promise<Species[]> {
  if (cache) return cache;
  const rawData = await getRacesRaw();
  cache = (rawData as unknown[]).map((raw) => mapSpecies(raw));
  return cache;
}

export async function getSpeciesById(id: string): Promise<Species | undefined> {
  const all = await getAllSpecies();
  return all.find((s) => s.id === id);
}

export async function getSpeciesByName(name: string): Promise<Species[]> {
  const all = await getAllSpecies();
  return all.filter((s) => s.name.toLowerCase() === name.toLowerCase());
}

export async function getSpeciesByCategory(
  category: SpeciesCategory,
): Promise<Species[]> {
  const all = await getAllSpecies();
  return all.filter((s) => s.category === category);
}

export async function getSubracesOf(parentName: string): Promise<Species[]> {
  const all = await getAllSpecies();
  return all.filter(
    (s) => s.parentSpecies?.toLowerCase() === parentName.toLowerCase(),
  );
}

export async function getRootSpecies(): Promise<Species[]> {
  const all = await getAllSpecies();
  return all.filter((s) => !s.isSubrace);
}

export function clearSpeciesCache(): void {
  cache = null;
}
