import { useEffect, useRef } from "react";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import {
  buildSpeciesLineageSpellSelections,
  combineSpeciesSpellGrantSource,
} from "@/features/raintdm/builder/utils/species-spell-grants.utils";
import { resolveSpeciesParts } from "@/features/raintdm/builder/utils/species-resolution.utils";

/** Syncs species lineage cantrips and innate spells into the spell grid. */
export function useSpeciesSpellGrantSync() {
  const {
    species,
    speciesSpellGroupChoice,
    character,
    addSpell,
    removeSpell,
  } = useCharacterBuilder();
  const syncedRef = useRef<{ level: number; id: string }[]>([]);

  useEffect(() => {
    for (const synced of syncedRef.current) {
      removeSpell(synced.level, synced.id);
    }
    syncedRef.current = [];

    if (!species) return;

    let cancelled = false;

    void resolveSpeciesParts(species).then(async (parts) => {
      const spellSource = combineSpeciesSpellGrantSource(
        parts.mhSpecies ?? parts.dndRace,
        parts.mhSubrace ?? parts.dndSubrace,
      );
      if (
        cancelled ||
        !spellSource ||
        (!spellSource.universalCantrips?.length &&
          !spellSource.namedSpellGroups?.length)
      ) {
        return;
      }

      const selections = await buildSpeciesLineageSpellSelections(
        spellSource,
        speciesSpellGroupChoice,
        character.level,
      );

      if (cancelled) return;

      for (const spell of selections) {
        addSpell(spell.level, spell);
      }
      syncedRef.current = selections.map((spell) => ({
        level: spell.level,
        id: spell.id,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [
    species?.id,
    species?.subraceId,
    speciesSpellGroupChoice,
    character.level,
    addSpell,
    removeSpell,
  ]);
}
