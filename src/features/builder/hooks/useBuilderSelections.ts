import { useMemo } from "react";
import type { Class, Species, Subclass } from "@/shared/types";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedClass(): {
  classData: Class | null;
  loading: boolean;
} {
  const { classData, classDataLoading } = useCharacterBuilder();
  return { classData, loading: classDataLoading };
}

export function useSelectedSpecies(): {
  species: Species | null;
  loading: boolean;
} {
  const { speciesData, speciesDataLoading } = useCharacterBuilder();
  return { species: speciesData, loading: speciesDataLoading };
}

export function useSelectedSubclass(): Subclass | null {
  const { subclass } = useCharacterBuilder();
  const { classData } = useSelectedClass();

  return useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find((sc) => sc.id === subclass.id) ??
      null
    );
  }, [classData, subclass]);
}
