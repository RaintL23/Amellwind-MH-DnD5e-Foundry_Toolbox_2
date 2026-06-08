import { useEffect, useState } from "react";
import type { Species } from "@/shared/types";
import { formatAbilitySummary } from "@/features/dnd-races/mappers/dnd-race.mapper";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
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

    Promise.all([
      getSpeciesById(speciesRef.id),
      getDndRaceById(speciesRef.id),
      speciesRef.subraceId
        ? getDndRaceById(speciesRef.subraceId)
        : Promise.resolve(undefined),
    ])
      .then(([mhSpecies, dndRace, dndSubrace]) => {
        if (cancelled) return;

        const base = mhSpecies ?? dndRace;
        if (!base) {
          setSpecies(null);
          return;
        }

        const abilityBonuses = [
          ...base.abilityBonuses,
          ...(dndSubrace?.abilityBonuses ?? []),
        ];
        const displayName = speciesRef.subraceName
          ? `${base.name} (${speciesRef.subraceName})`
          : base.name;

        setSpecies({
          ...(base as Species),
          name: displayName,
          abilityBonuses,
          abilitySummary: formatAbilitySummary(abilityBonuses),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [speciesRef?.id, speciesRef?.subraceId, speciesRef?.subraceName]);

  return { species, loading };
}
