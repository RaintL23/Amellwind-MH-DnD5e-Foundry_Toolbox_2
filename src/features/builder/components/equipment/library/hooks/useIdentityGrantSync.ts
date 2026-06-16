import { useEffect } from "react";
import { getSpeciesById } from "@/features/species/services/species.service";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { getBackgroundById } from "@/features/backgrounds/services/background.service";
import { getDndBackgroundById } from "@/features/dnd-backgrounds/services/dnd-background.service";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import {
  isAmellwindBackgroundSelection,
  isAmellwindSpeciesSelection,
} from "@/features/builder/utils/homebrew-cleanup.utils";
import type { DndRace } from "@/shared/types";
import type { DefenseGrant } from "@/shared/types/proficiency.types";

function resolveSpeciesDefenseGrants(
  base: DndRace,
  subrace: DndRace | null,
  groupChoice: string | null,
): DefenseGrant[] {
  const raceSource = { type: "species" as const, name: base.name };

  if (base.namedSpellGroups && base.namedSpellGroups.length > 0 && groupChoice) {
    const chosen = base.namedSpellGroups.find(
      (group) => group.name.toLowerCase() === groupChoice.toLowerCase(),
    );
    if (chosen?.resistance) {
      const fixedGrant: DefenseGrant = {
        kind: "fixed",
        types: [chosen.resistance],
        defenseKind: "resistance",
        source: raceSource,
      };
      return [fixedGrant, ...(subrace?.defenseGrants ?? [])];
    }
  }

  return [...base.defenseGrants, ...(subrace?.defenseGrants ?? [])];
}

const EMPTY_SPECIES_GRANTS = {
  source: "species" as const,
  skillGrants: [],
  skillAdvantages: [],
  toolGrants: [],
  languageGrants: [],
  defenseGrants: [],
};

const EMPTY_BACKGROUND_GRANTS = {
  source: "background" as const,
  skillGrants: [],
  toolGrants: [],
  languageGrants: [],
};

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

    async function syncSpeciesGrants() {
      const useAmellwind =
        useAmellwindHomebrew &&
        (await isAmellwindSpeciesSelection(species!));

      if (!useAmellwind) {
        const base = await getDndRaceById(species!.id);
        if (cancelled) return;

        if (!base) {
          applyIdentityGrants(EMPTY_SPECIES_GRANTS);
          return;
        }

        const subrace = species!.subraceId
          ? await getDndRaceById(species!.subraceId)
          : undefined;
        if (cancelled) return;

        if (species!.subraceId && !subrace) {
          setSpecies({
            id: species!.id,
            name: species!.name,
            subraceId: null,
            subraceName: null,
          });
        }

        applyIdentityGrants({
          source: "species",
          skillGrants: [
            ...base.skillGrants,
            ...(subrace?.skillGrants ?? []),
          ],
          skillAdvantages: [
            ...base.skillAdvantages,
            ...(subrace?.skillAdvantages ?? []),
          ],
          languageGrants: [
            ...base.languageGrants,
            ...(subrace?.languageGrants ?? []),
          ],
          defenseGrants: resolveSpeciesDefenseGrants(
            base,
            subrace ?? null,
            speciesSpellGroupChoice,
          ),
        });
        return;
      }

      const data = await getSpeciesById(species!.id);
      if (cancelled || !data) {
        if (!cancelled) applyIdentityGrants(EMPTY_SPECIES_GRANTS);
        return;
      }

      applyIdentityGrants({
        source: "species",
        skillGrants: data.skillGrants,
        skillAdvantages: data.skillAdvantages ?? [],
        languageGrants: data.languageGrants ?? [],
        defenseGrants: data.defenseGrants ?? [],
      });
    }

    void syncSpeciesGrants();

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

    async function syncBackgroundGrants() {
      const useAmellwind =
        useAmellwindHomebrew &&
        (await isAmellwindBackgroundSelection(background!));

      const data = useAmellwind
        ? await getBackgroundById(background!.id)
        : await getDndBackgroundById(background!.id);

      if (cancelled || !data || !("skillGrants" in data)) {
        if (!cancelled) applyIdentityGrants(EMPTY_BACKGROUND_GRANTS);
        return;
      }

      applyIdentityGrants({
        source: "background",
        skillGrants: data.skillGrants,
        toolGrants: "toolGrants" in data ? data.toolGrants : [],
        languageGrants: "languageGrants" in data ? data.languageGrants : [],
      });
    }

    void syncBackgroundGrants();

    return () => {
      cancelled = true;
    };
  }, [background?.id, useAmellwindHomebrew, applyIdentityGrants]);
}
