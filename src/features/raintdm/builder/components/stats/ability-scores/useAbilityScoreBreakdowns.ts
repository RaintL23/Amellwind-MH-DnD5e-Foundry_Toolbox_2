import { useMemo } from "react";
import { AbilityKey } from "@/shared/types";
import { useCharacterBuilder } from "../../../context/CharacterBuilderContext";
import {
  useSelectedClass,
  useSelectedSpecies,
} from "../../../hooks/useBuilderSelections";
import { useSelectedDndBackground } from "../../../hooks/useSelectedDndBackground";
import {
  applyBaseScores,
  buildAbilityBonusMap,
} from "../../../utils/species-ability-bonuses";
import { applyFeatAsiBonuses } from "../../../utils/feat-asi-bonuses";
import { getFeatSlotLevels } from "../../../utils/builder-class.utils";
import {
  buildClassLevelEntries,
  getFeatSlotLevelsForBuild,
} from "../../../utils/multiclass.utils";

export function useAbilityScoreBreakdowns() {
  const {
    character,
    class: classSelection,
    subclass,
    featSelections,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
  } = useCharacterBuilder();
  const { species } = useSelectedSpecies();
  const { classData } = useSelectedClass();
  const { dndBackground } = useSelectedDndBackground();

  const scoreBreakdowns = useMemo(() => {
    const bonusMap = buildAbilityBonusMap(species, {
      useTashaOrigin,
      tashaPlus2,
      tashaPlus1,
      speciesChoices: speciesAbilityChoices,
      background: dndBackground
        ? {
            name: dndBackground.name,
            abilityBonuses: dndBackground.abilityBonuses,
          }
        : null,
      backgroundAsiMode,
      backgroundAsiPlus2,
      backgroundAsiPlus1,
    });
    const slotLevels =
      multiclassEnabled && multiclassEntries.length > 0
        ? getFeatSlotLevelsForBuild(
            buildClassLevelEntries(
              classSelection,
              classData,
              primaryClassLevel,
              subclass,
              multiclassEntries,
              multiclassClassData,
            ),
            character.level,
          )
        : getFeatSlotLevels(classSelection?.name ?? "", character.level);
    applyFeatAsiBonuses(bonusMap, featSelections, slotLevels);
    return applyBaseScores(bonusMap, character.abilities);
  }, [
    species,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    dndBackground,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
    featSelections,
    classSelection,
    classData,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    character.abilities,
    character.level,
  ]);

  const getBreakdown = (key: AbilityKey, baseScore: number) => ({
    ...scoreBreakdowns[key],
    base: baseScore,
    total: baseScore + scoreBreakdowns[key].bonus,
  });

  return { scoreBreakdowns, getBreakdown };
}
