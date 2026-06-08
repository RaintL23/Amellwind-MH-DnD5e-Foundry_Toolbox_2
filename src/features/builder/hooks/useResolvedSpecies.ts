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
      speciesRef.subraceId ? getDndRaceById(speciesRef.subraceId) : Promise.resolve(undefined),
    ]).then(([mhSpecies, dndRace, dndSubrace]) => {
      if (cancelled) return;
      const resolved = mhSpecies ?? dndRace;
      if (!resolved) {
        setData(null);
        return;
      }

      const displayName = speciesRef.subraceName
        ? `${resolved.name} (${speciesRef.subraceName})`
        : resolved.name;
      const traits = [
        ...resolved.traits,
        ...(dndSubrace?.traits ?? []),
      ];

      setData({ name: displayName, traits });
    });

    return () => {
      cancelled = true;
    };
  }, [speciesRef?.id, speciesRef?.subraceId, speciesRef?.subraceName]);

  return data;
}
