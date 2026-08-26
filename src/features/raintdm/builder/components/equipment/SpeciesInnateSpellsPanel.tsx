/**
 * Species/subspecies innate spell grant label for the unified Spellcasting title.
 * Unlocked grants sync into spellSelections via useSpeciesSpellGrantSync and appear
 * as slots in SpellcastingGridPanel (locked future unlocks stay hidden until earned).
 */
import { useEffect, useState } from "react";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import { resolveSpeciesParts } from "@/features/raintdm/builder/utils/species-resolution.utils";
import {
  combineSpeciesSpellGrantSource,
  resolveActiveSpellGroup,
  speciesSpellGrantSourceHasSpells,
} from "@/features/raintdm/builder/utils/species-spell-grants.utils";

export interface SpeciesSpellGrantUiState {
  groupLabel: string | null;
}

/** Resolves the species/lineage label used in the Spellcasting section title. */
export function useSpeciesSpellGrantUi(): SpeciesSpellGrantUiState {
  const { species, speciesSpellGroupChoice } = useCharacterBuilder();
  const [groupLabel, setGroupLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!species) {
      setGroupLabel(null);
      return;
    }

    let cancelled = false;
    void resolveSpeciesParts(species).then((parts) => {
      const source = combineSpeciesSpellGrantSource(
        parts.mhSpecies ?? parts.dndRace,
        parts.mhSubrace ?? parts.dndSubrace,
      );
      if (cancelled || !speciesSpellGrantSourceHasSpells(source)) {
        if (!cancelled) setGroupLabel(null);
        return;
      }

      const group = resolveActiveSpellGroup(source!, speciesSpellGroupChoice);
      const label =
        group?.name && group.name !== "Innate Spells"
          ? group.name
          : (parts.mhSubrace?.name ??
            parts.dndSubrace?.name ??
            parts.base?.name ??
            "Species");

      setGroupLabel(label);
    });

    return () => {
      cancelled = true;
    };
  }, [species?.id, species?.subraceId, speciesSpellGroupChoice]);

  return { groupLabel };
}
