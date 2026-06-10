import { useMemo } from "react";
import type { AbilityKey } from "@/shared/types";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useResolvedSpecies } from "./useResolvedSpecies";
import { useSelectedClass } from "./useSelectedClass";
import {
  getCharacterAcBreakdown,
  type CharacterAcBreakdown,
} from "../utils/character-armor-class";

const ABILITY_KEYS: AbilityKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

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

  const subclassData = useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find((entry) => entry.id === subclass.id) ??
      null
    );
  }, [classData, subclass]);

  const modifiers = useMemo(
    () =>
      Object.fromEntries(
        ABILITY_KEYS.map((key) => [key, character.getModifier(key)]),
      ) as Record<AbilityKey, number>,
    [character.abilities],
  );

  return useMemo(
    () =>
      getCharacterAcBreakdown({
        modifiers,
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
