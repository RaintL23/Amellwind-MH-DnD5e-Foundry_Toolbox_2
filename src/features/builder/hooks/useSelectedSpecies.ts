import { useEffect, useState } from "react";
import type { Species } from "@/shared/types";
import { getSpeciesById } from "@/features/species/services/species.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export function useSelectedSpecies(): {
  species: Species | null;
  loading: boolean;
} {
  const { species: speciesRef } = useCharacterBuilder();
  const [species, setSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!speciesRef) {
      setSpecies(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getSpeciesById(speciesRef.id)
      .then((data) => {
        if (!cancelled) setSpecies(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [speciesRef?.id]);

  return { species, loading };
}
