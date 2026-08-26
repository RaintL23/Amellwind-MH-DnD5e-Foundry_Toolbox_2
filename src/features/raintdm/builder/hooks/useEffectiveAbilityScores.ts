import { useMemo } from "react";
import type { AbilityKey, AbilityScores } from "@/shared/types";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass, useSelectedSpecies } from "./useBuilderSelections";
import { useSelectedDndBackground } from "./useSelectedDndBackground";
import {
  abilityModifiersFromScores,
  computeEffectiveAbilityScores,
} from "../utils/effective-ability-scores";

/** Effective ability scores including origin bonuses and feat ASIs. */
export function useEffectiveAbilityScores(): AbilityScores {
  const {
    character,
    class: classSelection,
    featSelections,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const { species } = useSelectedSpecies();
  const { dndBackground } = useSelectedDndBackground();

  return useMemo(
    () =>
      computeEffectiveAbilityScores({
        baseScores: character.abilities,
        level: character.level,
        classSelection,
        classData,
        multiclassEnabled,
        multiclassEntries,
        multiclassClassData,
        species,
        featSelections,
        useTashaOrigin,
        tashaPlus2,
        tashaPlus1,
        speciesAbilityChoices,
        background: dndBackground
          ? {
              name: dndBackground.name,
              abilityBonuses: dndBackground.abilityBonuses,
            }
          : null,
        backgroundAsiMode,
        backgroundAsiPlus2,
        backgroundAsiPlus1,
      }),
    [
      character.abilities,
      character.level,
      classSelection,
      classData,
      multiclassEnabled,
      multiclassEntries,
      multiclassClassData,
      species,
      dndBackground,
      useTashaOrigin,
      tashaPlus2,
      tashaPlus1,
      speciesAbilityChoices,
      backgroundAsiMode,
      backgroundAsiPlus2,
      backgroundAsiPlus1,
      featSelections,
    ],
  );
}

/** Ability modifiers derived from {@link useEffectiveAbilityScores}. */
export function useEffectiveAbilityModifiers(): Record<AbilityKey, number> {
  const scores = useEffectiveAbilityScores();
  return useMemo(() => abilityModifiersFromScores(scores), [scores]);
}
