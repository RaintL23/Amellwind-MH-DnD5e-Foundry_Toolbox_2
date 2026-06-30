import { useMemo } from "react";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass, useSelectedSpecies } from "./useBuilderSelections";
import { useActiveResolvedFeats } from "./useActiveResolvedFeats";
import {
  collectEquippedRuneSpeedBonuses,
  detectFeatSpeedBonuses,
  getCharacterSpeedBreakdown,
  normalizeBuilderCreatureSize,
  type CharacterSpeedBreakdown,
  type SpeedBonus,
} from "../utils/character-speed";

export function useCharacterSpeed(): CharacterSpeedBreakdown {
  const {
    character,
    subclass,
    mainHand,
    offHand,
    armor,
    trinket1,
    trinket2,
    useAmellwindHomebrew,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const { species } = useSelectedSpecies();
  const activeFeats = useActiveResolvedFeats();

  const featBonuses = useMemo<SpeedBonus[]>(
    () => activeFeats.flatMap((feat) => detectFeatSpeedBonuses(feat)),
    [activeFeats],
  );

  const subclassData = useMemo(() => {
    if (!classData || !subclass) return null;
    return (
      subclassesForClassVariant(classData).find(
        (entry) => entry.id === subclass.id,
      ) ?? null
    );
  }, [classData, subclass]);

  const runeBonuses = useMemo(
    () =>
      useAmellwindHomebrew
        ? collectEquippedRuneSpeedBonuses({
            mainHand,
            offHand,
            armor,
            trinket1,
            trinket2,
          })
        : [],
    [mainHand, offHand, armor, trinket1, trinket2, useAmellwindHomebrew],
  );

  return useMemo(
    () =>
      getCharacterSpeedBreakdown({
        creatureSize: normalizeBuilderCreatureSize(character.size),
        speciesSpeedText: species?.speed,
        speciesName: species?.name,
        classData,
        subclass: subclassData,
        level: character.level,
        featBonuses,
        runeBonuses,
      }),
    [
      character.size,
      species?.speed,
      species?.name,
      classData,
      subclassData,
      character.level,
      featBonuses,
      runeBonuses,
    ],
  );
}
