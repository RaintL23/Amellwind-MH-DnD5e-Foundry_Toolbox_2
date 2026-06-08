import { useEffect, useState } from "react";
import type { SpeciesTrait } from "@/shared/types";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { getSpeciesById } from "@/features/species/services/species.service";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";

export interface ResolvedSpeciesData {
  name: string;
  traits: SpeciesTrait[];
}

export function useResolvedSpecies(): ResolvedSpeciesData | null {
  const { species: speciesRef } = useCharacterBuilder();
  const [data, setData] = useState<ResolvedSpeciesData | null>(null);

  useEffect(() => {
    if (!speciesRef) {
      setData(null);
      return;
    }

    let cancelled = false;

    Promise.all([
      getSpeciesById(speciesRef.id),
      getDndRaceById(speciesRef.id),
    ]).then(([mhSpecies, dndRace]) => {
      if (cancelled) return;
      const resolved = mhSpecies ?? dndRace;
      if (!resolved) {
        setData(null);
        return;
      }
      setData({ name: resolved.name, traits: resolved.traits });
    });

    return () => {
      cancelled = true;
    };
  }, [speciesRef?.id]);

  return data;
}
