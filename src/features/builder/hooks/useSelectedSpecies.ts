import type { Species } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedSpecies(): {
  species: Species | null;
  loading: boolean;
} {
  const { speciesData, speciesDataLoading } = useCharacterBuilder();
  return { species: speciesData, loading: speciesDataLoading };
}
