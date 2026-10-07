import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSpellcastingContext } from "../context/SpellcastingContext";
import { getAttunementInfo } from "../utils/attunement.utils";
import { computeSpellcastingAttackStats } from "../utils/spellcasting-stats.utils";
import { useCharacterArmorClass } from "./useCharacterArmorClass";
import { useCharacterHitPoints } from "./useCharacterHitPoints";
import { useCharacterSpeed } from "./useCharacterSpeed";
import { useEffectiveAbilityScores } from "./useEffectiveAbilityScores";

/** Derived combat stats shared by the General Stats panel and the mobile summary strip. */
export function useBuilderDerivedStats() {
  const { character, class: classSelection } = useCharacterBuilder();
  const hitPoints = useCharacterHitPoints();
  const armorClass = useCharacterArmorClass();
  const speed = useCharacterSpeed();
  const effectiveScores = useEffectiveAbilityScores();
  const { spellcasting } = useSpellcastingContext();
  const proficiencyBonus = character.getProficiencyBonus();

  const passivePerception =
    10 +
    getAbilityModifier(effectiveScores.wis) +
    character.getSkillProficiencyLevel("prc") * proficiencyBonus;

  const spellAttackStats = spellcasting?.isSpellcaster
    ? computeSpellcastingAttackStats(
        spellcasting.spellcastingAbility,
        proficiencyBonus,
        (key) => getAbilityModifier(effectiveScores[key]),
      )
    : null;

  return {
    proficiencyBonus,
    hitPoints,
    armorClass,
    speed,
    initiative: getAbilityModifier(effectiveScores.dex),
    passivePerception,
    spellAttackStats,
    attunement: getAttunementInfo(classSelection?.name, character.level),
  };
}
