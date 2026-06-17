import { useEffect } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import {
  EMPTY_BACKGROUND_GRANTS,
  EMPTY_SPECIES_GRANTS,
} from "@/features/builder/utils/grant-sync.constants";
import {
  loadBackgroundGrantPayload,
  loadSpeciesGrantPayload,
} from "@/features/builder/utils/identity-grant-sync.utils";

/** Syncs species/background proficiencies regardless of the active library slot. */
export function useIdentityGrantSync() {
  const {
    species,
    background,
    speciesSpellGroupChoice,
    useAmellwindHomebrew,
    applyIdentityGrants,
    setSpecies,
  } = useCharacterBuilder();

  useEffect(() => {
    if (!species) {
      applyIdentityGrants(EMPTY_SPECIES_GRANTS);
      return;
    }

    let cancelled = false;

    void loadSpeciesGrantPayload(
      species,
      speciesSpellGroupChoice,
      useAmellwindHomebrew,
    ).then(({ payload, invalidSubrace }) => {
      if (cancelled) return;

      if (invalidSubrace) {
        setSpecies({
          id: species.id,
          name: species.name,
          subraceId: null,
          subraceName: null,
        });
        return;
      }

      applyIdentityGrants(payload);
    });

    return () => {
      cancelled = true;
    };
  }, [
    species?.id,
    species?.subraceId,
    speciesSpellGroupChoice,
    useAmellwindHomebrew,
    applyIdentityGrants,
    setSpecies,
  ]);

  useEffect(() => {
    if (!background) {
      applyIdentityGrants(EMPTY_BACKGROUND_GRANTS);
      return;
    }

    let cancelled = false;

    void loadBackgroundGrantPayload(background, useAmellwindHomebrew).then(
      (payload) => {
        if (!cancelled) applyIdentityGrants(payload);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [background?.id, useAmellwindHomebrew, applyIdentityGrants]);
}
