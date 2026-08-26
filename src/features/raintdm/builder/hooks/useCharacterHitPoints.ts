import { useMemo } from "react";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass } from "./useBuilderSelections";
import { useActiveResolvedFeats } from "./useActiveResolvedFeats";
import { useEffectiveAbilityScores } from "./useEffectiveAbilityScores";
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
  const effectiveScores = useEffectiveAbilityScores();
  const conMod = getAbilityModifier(effectiveScores.con);

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
        conMod,
        featBonuses,
      );
    }

    return getCharacterHitPointBreakdown(
      character.level,
      conMod,
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
    conMod,
    featBonuses,
  ]);
}
