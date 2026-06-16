import { useEffect, useRef } from "react";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { buildSpeciesLineageSpellSelections } from "@/features/builder/utils/species-spell-grants.utils";

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

    void getDndRaceById(species.id).then(async (race) => {
      if (cancelled || !race?.namedSpellGroups?.length) return;

      const selections = await buildSpeciesLineageSpellSelections(
        race,
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
    speciesSpellGroupChoice,
    character.level,
    addSpell,
    removeSpell,
  ]);
}
