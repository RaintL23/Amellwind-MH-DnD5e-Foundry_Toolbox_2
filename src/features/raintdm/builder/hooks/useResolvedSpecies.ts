import { useEffect, useState } from "react";
import type { SpeciesTrait } from "@/shared/types";
import { resolveSpeciesParts } from "../utils/species-resolution.utils";
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

    resolveSpeciesParts(speciesRef).then(({ base, dndSubrace, mhSubrace }) => {
      if (cancelled) return;
      if (!base) {
        setData(null);
        return;
      }

      const displayName = speciesRef.subraceName
        ? `${base.name} (${speciesRef.subraceName})`
        : base.name;
      const subrace = mhSubrace ?? dndSubrace;
      const traits = [
        ...base.traits,
        ...(subrace?.traits ?? []),
      ];

      setData({ name: displayName, traits });
    });

    return () => {
      cancelled = true;
    };
  }, [speciesRef?.id, speciesRef?.subraceId, speciesRef?.subraceName]);

  return data;
}
