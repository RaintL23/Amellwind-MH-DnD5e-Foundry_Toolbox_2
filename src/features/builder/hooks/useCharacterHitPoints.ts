import { useMemo } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass } from "./useBuilderSelections";
import { useActiveResolvedFeats } from "./useActiveResolvedFeats";
import {
  buildClassLevelEntries,
  getMulticlassHitPointBreakdown,
} from "../utils/multiclass.utils";
import {
  detectFeatHitPointBonus,
  getCharacterHitPointBreakdown,
  type CharacterHitPointBreakdown,
  type FeatHitPointBonus,
} from "../utils/character-hit-points";

export function useCharacterHitPoints(): CharacterHitPointBreakdown | null {
  const {
    character,
    class: classSelection,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const activeFeats = useActiveResolvedFeats();

  const featBonuses = useMemo<FeatHitPointBonus[]>(
    () =>
      activeFeats
        .map((feat) => detectFeatHitPointBonus(feat, character.level))
        .filter((bonus): bonus is FeatHitPointBonus => bonus !== null),
    [activeFeats, character.level],
  );

  return useMemo(() => {
    if (!classData?.hitDie) return null;

    if (multiclassEnabled && multiclassEntries.some((e) => e.classRef)) {
      const classEntries = buildClassLevelEntries(
        classSelection,
        classData,
        primaryClassLevel,
        subclass,
        multiclassEntries,
        multiclassClassData,
      );
      return getMulticlassHitPointBreakdown(
        classEntries,
        character.getModifier("con"),
        featBonuses,
      );
    }

    return getCharacterHitPointBreakdown(
      character.level,
      character.getModifier("con"),
      classData.hitDie,
      classData.name,
      featBonuses,
    );
  }, [
    classData?.hitDie,
    classData?.name,
    classSelection,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    character.level,
    character.abilities.con,
    featBonuses,
  ]);
}
