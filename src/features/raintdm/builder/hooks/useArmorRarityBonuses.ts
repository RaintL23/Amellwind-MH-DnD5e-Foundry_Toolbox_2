import { useMemo } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import {
  getArmorRarityBonuses,
  type ArmorRarityBonuses,
} from "../utils/armor-rarity-properties.utils";

/** Skill / save bonuses from the equipped armor's AGMH rarity properties. */
export function useArmorRarityBonuses(): ArmorRarityBonuses {
  const { armor, character, useAmellwindHomebrew } = useCharacterBuilder();
  return useMemo(
    () =>
      getArmorRarityBonuses(
        armor,
        (ability) => character.isSavingThrowProficient(ability),
        useAmellwindHomebrew,
      ),
    [armor, character, useAmellwindHomebrew],
  );
}
