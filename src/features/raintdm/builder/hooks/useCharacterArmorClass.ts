import { useMemo } from "react";
import type { AbilityKey } from "@/shared/types";
import { subclassesForClassVariant } from "@/features/dnd/classes/utils/class-subclass.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useResolvedSpecies } from "./useResolvedSpecies";
import { useSelectedClass } from "./useBuilderSelections";
import { useEffectiveAbilityModifiers } from "./useEffectiveAbilityScores";
import {
  getCharacterAcBreakdown,
  type CharacterAcBreakdown,
} from "../utils/character-armor-class";

export function useCharacterArmorClass(): CharacterAcBreakdown {
  const {
    character,
    armor,
    integratedShieldAcBonus,
    standaloneShieldAcBonus,
    subclass,
    class: classRef,
    species: speciesRef,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const resolvedSpecies = useResolvedSpecies();
  const modifiers = useEffectiveAbilityModifiers();

  const subclassData = useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find((entry) => entry.id === subclass.id) ??
      null
    );
  }, [classData, subclass]);

  return useMemo(
    () =>
      getCharacterAcBreakdown({
        modifiers: modifiers as Record<AbilityKey, number>,
        level: character.level,
        armor,
        integratedShieldAcBonus,
        standaloneShieldAcBonus,
        classData,
        className: classRef?.name,
        subclass: subclassData,
        speciesTraits: resolvedSpecies?.traits ?? [],
        speciesName: resolvedSpecies?.name ?? speciesRef?.name,
      }),
    [
      modifiers,
      character.level,
      armor,
      integratedShieldAcBonus,
      standaloneShieldAcBonus,
      classData,
      classRef?.name,
      subclassData,
      resolvedSpecies,
      speciesRef?.name,
    ],
  );
}
