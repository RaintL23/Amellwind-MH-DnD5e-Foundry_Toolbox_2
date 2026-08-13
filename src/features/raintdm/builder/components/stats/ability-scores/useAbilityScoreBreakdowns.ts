import { useMemo } from "react";
import { AbilityKey } from "@/shared/types";
import { useCharacterBuilder } from "../../../context/CharacterBuilderContext";
import { useSelectedSpecies } from "../../../hooks/useBuilderSelections";
import { useSelectedDndBackground } from "../../../hooks/useSelectedDndBackground";
import {
  applyBaseScores,
  buildAbilityBonusMap,
} from "../../../utils/species-ability-bonuses";
import { applyFeatAsiBonuses } from "../../../utils/feat-asi-bonuses";

export function useAbilityScoreBreakdowns() {
  const {
    character,
    class: classSelection,
    featSelections,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
  } = useCharacterBuilder();
  const { species } = useSelectedSpecies();
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
    applyFeatAsiBonuses(
      bonusMap,
      featSelections,
      classSelection?.name ?? "",
      character.level,
    );
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
    classSelection?.name,
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
