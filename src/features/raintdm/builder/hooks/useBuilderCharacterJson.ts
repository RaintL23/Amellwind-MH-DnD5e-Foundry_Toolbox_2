import { useCallback } from "react";
import { toAbilityKey } from "@/shared/constants/dnd";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { useSpellcastingContext } from "../context/SpellcastingContext";
import { useBuildCompleteness } from "../context/BuildCompletenessContext";
import { useEffectiveAbilityScores } from "./useEffectiveAbilityScores";
import { useBuilderDerivedStats } from "./useBuilderDerivedStats";
import {
  buildBuilderCharacterJson,
  buildCharacterProvenance,
  type BuilderCharacterDerived,
  type BuilderCharacterJson,
} from "../builder-json";

/**
 * Returns a builder for the complete Builder JSON envelope of the live build:
 * restorable state + provenance (with ids) + derived stats + creation-check
 * meta. Single source for Download JSON, Send to Character Sheet and the
 * export cache used by Load from Builder.
 */
export function useBuilderCharacterJson(): () => BuilderCharacterJson {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const effectiveAbilities = useEffectiveAbilityScores();
  const { bonusCantripPools, optionalFeatureSpellGrants, spellcasting } =
    useSpellcastingContext();
  const stats = useBuilderDerivedStats();
  const { evaluate } = useBuildCompleteness();

  return useCallback(() => {
    const provenance = buildCharacterProvenance({
      builder,
      effectiveAbilities,
      bonusSpellPools: bonusCantripPools,
      optionalFeatureSpellGrants,
    });

    const castingAbility = spellcasting?.isSpellcaster
      ? toAbilityKey(spellcasting.spellcastingAbility ?? null)
      : null;
    const derived: BuilderCharacterDerived = {
      proficiencyBonus: stats.proficiencyBonus,
      hitPoints: stats.hitPoints
        ? { max: stats.hitPoints.max, hitDice: stats.hitPoints.hitDice }
        : null,
      armorClass: stats.armorClass.total,
      initiative: stats.initiative,
      speed: Object.fromEntries(
        Object.entries(stats.speed.speed).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number",
        ),
      ),
      passivePerception: stats.passivePerception,
      spellcasting:
        castingAbility && stats.spellAttackStats?.spellSaveDc
          ? {
              ability: castingAbility,
              saveDc: Number(stats.spellAttackStats.spellSaveDc),
              attackBonus: Number(stats.spellAttackStats.spellAttackBonus ?? 0),
            }
          : null,
      attunement: {
        slots: stats.attunement.attunementSlots,
        artificerBonusMaterialSlots: stats.attunement.artificerBonusMaterialSlots,
      },
    };

    const completeness = evaluate();
    return buildBuilderCharacterJson(
      builder,
      { items: inventory.items },
      {
        provenance,
        derived,
        completeness: {
          complete: completeness.hasStarted && !completeness.shouldBlockExport,
          pendingChoices: completeness.issues.map((issue) => issue.message),
        },
      },
    );
  }, [
    builder,
    inventory.items,
    effectiveAbilities,
    bonusCantripPools,
    optionalFeatureSpellGrants,
    spellcasting,
    stats,
    evaluate,
  ]);
}
