import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_ALLY_AURA_RARITY,
  INLINE_ALLY_THROW_RARITY,
  INLINE_ALLY_REACTION_MOVE_RARITY,
  INLINE_AMMO_CAPACITY_RARITY,
  INLINE_AMMO_UNLOCK_RARITY,
  INLINE_ATTACK_BYPASS_IMMUNITY_RARITY,
  INLINE_ATTACK_BYPASS_RESISTANCE_RARITY,
  INLINE_BLIGHT_SWAP_RARITY,
  INLINE_CARVE_CHECK_RARITY,
  INLINE_CONJURE_ITEM_RARITY,
  INLINE_CONSUMABLE_SHARE_RARITY,
  INLINE_CONSUMABLE_EXTEND_RARITY,
  INLINE_CONDITIONAL_ATTACK_BONUS_RARITY,
  INLINE_CRAFTING_MAX_RARITY,
  INLINE_CREATURE_SENSE_RARITY,
  INLINE_CREATURE_PROXIMITY_RARITY,
  INLINE_CRIT_NEGATION_RARITY,
  INLINE_CRIT_NO_REACTIONS_RARITY,
  INLINE_DAMAGE_TYPE_SHIFT_RARITY,
  INLINE_DEGRADING_AC_RARITY,
  INLINE_DISPLACEMENT_RARITY,
  INLINE_DRAGONPIERCER_EXTRA_USES_RARITY,
  INLINE_ELEMENTAL_EXTRA_DIE_RARITY,
  INLINE_EXTRA_ATTACK_RARITY,
  INLINE_EXHAUSTION_MITIGATION_RARITY,
  INLINE_FORCED_PULL_RARITY,
  INLINE_FORCED_MOVEMENT_REDUCTION_RARITY,
  INLINE_GOLD_DOUBLE_RARITY,
  INLINE_HARMFUL_GAS_SAVE_ADVANTAGE_RARITY,
  INLINE_HEALING_REDUCTION_MAJOR_RARITY,
  INLINE_HEALING_REDUCTION_RARITY,
  INLINE_HEALING_REROLL_RARITY,
  INLINE_HEAL_SELF_BOOST_RARITY,
  INLINE_HELP_ACTION_RARITY,
  INLINE_HIDDEN_SENSE_RARITY,
  INLINE_HP_SACRIFICE_RARITY,
  INLINE_HERB_CONSUMPTION_RARITY,
  INLINE_HOURLY_RECHARGE_RARITY,
  INLINE_ICE_RESERVOIR_MAJOR_RARITY,
  INLINE_ICE_RESERVOIR_RARITY,
  INLINE_INSPIRATION_RARITY,
  INLINE_ITEM_TRANSFORM_RARITY,
  INLINE_JUMP_MOVEMENT_RARITY,
  INLINE_MATERIAL_SENSE_RARITY,
  INLINE_MAGIC_RESISTANCE_MAJOR_RARITY,
  INLINE_MAGIC_RESISTANCE_RARITY,
  INLINE_MISS_TRIGGER_RARITY,
  INLINE_NO_OPPORTUNITY_ATTACKS_RARITY,
  INLINE_PLANE_SHIFT_RARITY,
  INLINE_POISON_DC_BOOST_RARITY,
  INLINE_POWERHOUSE_RARITY,
  INLINE_PREHENSILE_TAIL_RARITY,
  INLINE_PROFICIENCY_IMPROVISED_RARITY,
  INLINE_PUSH_ON_HIT_RARITY,
  INLINE_SAVE_DC_BOOST_RARITY,
  INLINE_SAVE_FAILURE_MARGIN_RARITY,
  INLINE_SAVE_REROLL_RARITY,
  INLINE_SIGNAL_FLARE_MAJOR_RARITY,
  INLINE_SIGNAL_FLARE_RARITY,
  INLINE_SPELL_BYPASS_IMMUNITY_RARITY,
  INLINE_SPELL_BYPASS_RESISTANCE_RARITY,
  INLINE_SUMMON_EXTENDED_RARITY,
  INLINE_TRAP_PLACEMENT_RARITY,
  INLINE_UNARMED_UPGRADE_RARITY,
  INLINE_WEAPON_CLASS_MODE_RARITY,
  INLINE_WEAPON_MODE_SWITCH_RARITY,
  INLINE_WEB_SENSE_RARITY,
  INLINE_WOUND_CRIT_RARITY,
  INLINE_COMPOSITE_EFFECT_RARITY,
  INLINE_CHARGE_MOVEMENT_RARITY,
  MATERIAL_EFFECT_RARITIES,
} from "../constants/material-effect.constants";
import { parseAcBonusAmount } from "./inline-ac-bonus-rarity.utils";
import { rarityForFlatBonusAmount } from "./inline-flat-bonus-rarity.utils";
import {
  inferRarityFromConditionalSaveBonusTags,
  inferRarityFromGenericSaveBonusAmount,
} from "./inline-save-bonus-rarity.utils";

function higherRarity(a: ResourceRarity, b: ResourceRarity): ResourceRarity {
  return MATERIAL_EFFECT_RARITIES.indexOf(a) >= MATERIAL_EFFECT_RARITIES.indexOf(b)
    ? a
    : b;
}

/** Always-on +N to all saving throws. */
export function inferRarityFromGenericSaveBonusTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  return (
    inferRarityFromConditionalSaveBonusTags(text, tags) ??
    inferRarityFromGenericSaveBonusAmount(text, tags)
  );
}

function parsePoisonDcBoostAmount(text: string): number {
  const match = text.match(/save DC is increased by (\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function parseSaveDcBoostAmount(text: string): number {
  const match = text.match(
    /save DC for condition causing effects[\s\S]{0,80}?increased by (\d+)/i,
  );
  return match ? parseInt(match[1], 10) : 0;
}

function rarityFromAmountTable(
  amount: number,
  table: ResourceRarity[],
): ResourceRarity {
  const idx = Math.min(Math.max(1, amount), table.length - 1);
  return table[idx] ?? "Uncommon";
}

export function inferRarityFromPoisonDcBoostTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:poison-dc-boost")) return null;
  const amount = parsePoisonDcBoostAmount(text);
  return rarityFromAmountTable(amount || 1, INLINE_POISON_DC_BOOST_RARITY);
}

export function inferRarityFromSaveDcBoostTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:save-dc-boost")) return null;
  const amount = parseSaveDcBoostAmount(text);
  return rarityFromAmountTable(amount || 1, INLINE_SAVE_DC_BOOST_RARITY);
}

export function inferRarityFromConjureItemTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:conjure-item")
    ? INLINE_CONJURE_ITEM_RARITY
    : null;
}

export function inferRarityFromForcedMovementReductionTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:forced-movement-reduction")
    ? INLINE_FORCED_MOVEMENT_REDUCTION_RARITY
    : null;
}

export function inferRarityFromHerbConsumptionTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:herb-consumption")
    ? INLINE_HERB_CONSUMPTION_RARITY
    : null;
}

export function inferRarityFromConsumableShareTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:consumable-share")
    ? INLINE_CONSUMABLE_SHARE_RARITY
    : null;
}

export function inferRarityFromAmmoUnlockTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:ammo-unlock")
    ? INLINE_AMMO_UNLOCK_RARITY
    : null;
}

export function inferRarityFromMissTriggerTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:miss-trigger")
    ? INLINE_MISS_TRIGGER_RARITY
    : null;
}

export function inferRarityFromInspirationTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:inspiration")
    ? INLINE_INSPIRATION_RARITY
    : null;
}

export function inferRarityFromHourlyRechargeTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:recharge-hourly")
    ? INLINE_HOURLY_RECHARGE_RARITY
    : null;
}

/** Advantage on saves vs spells (and optional spell-attack disadvantage). */
export function inferRarityFromMagicResistanceTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:magic-resistance")) return null;
  if (set.has("mechanic:spell-attack-disadvantage")) {
    return INLINE_MAGIC_RESISTANCE_MAJOR_RARITY;
  }
  return INLINE_MAGIC_RESISTANCE_RARITY;
}

/** Incoming critical hits become normal hits. */
export function inferRarityFromCritNegationTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:crit-negation")
    ? INLINE_CRIT_NEGATION_RARITY
    : null;
}

/** Bonus-action pull on a ranged weapon hit. */
export function inferRarityFromForcedPullTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:forced-movement")
    ? INLINE_FORCED_PULL_RARITY
    : null;
}

/** On-hit push / pull via ability check. */
export function inferRarityFromPushOnHitTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:push")) return null;
  if (!set.has("type:offensive")) return null;
  return INLINE_PUSH_ON_HIT_RARITY;
}

/** Conditional +N attack bonus after a charge / movement gate. */
export function inferRarityFromChargeAttackTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:charge-attack")
    ? INLINE_CONDITIONAL_ATTACK_BONUS_RARITY
    : null;
}

/** Help-action ally weapon buff. */
export function inferRarityFromHelpActionTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:help-action")
    ? INLINE_HELP_ACTION_RARITY
    : null;
}

/** Activated sense for buried field materials. */
export function inferRarityFromMaterialSenseTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:material-sense")
    ? INLINE_MATERIAL_SENSE_RARITY
    : null;
}

/** Improvised-weapon proficiency while attuned. */
export function inferRarityFromImprovisedProficiencyTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:proficiency-improvised")
    ? INLINE_PROFICIENCY_IMPROVISED_RARITY
    : null;
}

/** Once-per-turn extra weapon attack rider. */
export function inferRarityFromExtraAttackTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:extra-attack")
    ? INLINE_EXTRA_ATTACK_RARITY
    : null;
}

/** Advantage on saves vs harmful gases / vapors (often paired with breathe-any-environment). */
export function inferRarityFromHarmfulGasSaveTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:against-condition")) return null;
  if (!set.has("mechanic:advantage")) return null;
  if (set.has("mechanic:breathe-any-environment")) {
    return INLINE_HARMFUL_GAS_SAVE_ADVANTAGE_RARITY;
  }
  return null;
}

/** Jump-and-grab movement does not consume movement. */
export function inferRarityFromJumpMovementTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:jump-movement")
    ? INLINE_JUMP_MOVEMENT_RARITY
    : null;
}

/** Partial exhaustion mitigation (ignore first N levels). */
export function inferRarityFromExhaustionMitigationTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:exhaustion-mitigation")
    ? INLINE_EXHAUSTION_MITIGATION_RARITY
    : null;
}

/** One additional elemental damage die on hit. */
export function inferRarityFromElementalExtraDieTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:extra-damage-die")
    ? INLINE_ELEMENTAL_EXTRA_DIE_RARITY
    : null;
}

/** Interplanar travel wording. */
export function inferRarityFromPlaneShiftTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:plane-shift")
    ? INLINE_PLANE_SHIFT_RARITY
    : null;
}

export function inferRarityFromWeaponModeSwitchTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:weapon-mode")
    ? INLINE_WEAPON_MODE_SWITCH_RARITY
    : null;
}

export function inferRarityFromItemTransformTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:item-transform")
    ? INLINE_ITEM_TRANSFORM_RARITY
    : null;
}

export function inferRarityFromAllyAuraTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:ally-aura")
    ? INLINE_ALLY_AURA_RARITY
    : null;
}

export function inferRarityFromAllyThrowTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:ally-throw")
    ? INLINE_ALLY_THROW_RARITY
    : null;
}

export function inferRarityFromPowerhouseTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:powerhouse")
    ? INLINE_POWERHOUSE_RARITY
    : null;
}

export function inferRarityFromSummonTags(
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:summon")) return null;
  return tags.includes("mechanic:recharge-extended")
    ? INLINE_SUMMON_EXTENDED_RARITY
    : INLINE_SUMMON_EXTENDED_RARITY;
}

export function inferRarityFromDamageTypeShiftTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:damage-type-shift")
    ? INLINE_DAMAGE_TYPE_SHIFT_RARITY
    : null;
}

function parseDragonpiercerExtraUses(text: string): number {
  if (!/dragonpiercer/i.test(text)) return 0;
  if (/three additional times/i.test(text)) return 3;
  if (/two additional times/i.test(text)) return 2;
  if (/one additional time/i.test(text)) return 1;
  return 1;
}

export function inferRarityFromDragonpiercerTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:dragonpiercer")) return null;
  const uses = parseDragonpiercerExtraUses(text);
  const idx = Math.min(
    Math.max(uses, 1),
    INLINE_DRAGONPIERCER_EXTRA_USES_RARITY.length - 1,
  );
  return INLINE_DRAGONPIERCER_EXTRA_USES_RARITY[idx] ?? "Uncommon";
}

export function inferRarityFromCritNoReactionsTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:crit-no-reactions")
    ? INLINE_CRIT_NO_REACTIONS_RARITY
    : null;
}

export function inferRarityFromResistanceBypassTags(
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  let best: ResourceRarity | null = null;

  const push = (rarity: ResourceRarity) => {
    best = best ? higherRarity(best, rarity) : rarity;
  };

  if (set.has("mechanic:immunity-bypass")) {
    push(
      set.has("mechanic:spell-bypass")
        ? INLINE_SPELL_BYPASS_IMMUNITY_RARITY
        : INLINE_ATTACK_BYPASS_IMMUNITY_RARITY,
    );
  } else if (set.has("mechanic:resistance-bypass")) {
    push(
      set.has("mechanic:spell-bypass")
        ? INLINE_SPELL_BYPASS_RESISTANCE_RARITY
        : INLINE_ATTACK_BYPASS_RESISTANCE_RARITY,
    );
  }

  return best;
}

export function inferRarityFromDegradingAcTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:degrading-ac")) return null;
  const amount = parseAcBonusAmount(text);
  if (amount != null && amount >= 3) return INLINE_DEGRADING_AC_RARITY;
  return INLINE_DEGRADING_AC_RARITY;
}

export function inferRarityFromConditionalAcTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:conditional-ac")) return null;
  const amount = parseAcBonusAmount(text);
  if (amount == null || amount < 1) return null;
  return rarityForFlatBonusAmount(amount, true);
}

function parseUnarmedUpgradeDie(text: string): number {
  const match = text.match(/use a d(\d+) in place of the normal weapon damage dice/i);
  return match ? parseInt(match[1], 10) : 6;
}

function parseWoundCritDie(text: string): number {
  const match = text.match(/roll a d(\d+)/i);
  return match ? parseInt(match[1], 10) : 6;
}

function parseAbilityScoreSet(text: string): number | null {
  const match = text.match(
    /(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) score is (\d+)/i,
  );
  return match ? parseInt(match[1], 10) : null;
}

export function inferRarityFromHealingRerollTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:healing-reroll")
    ? INLINE_HEALING_REROLL_RARITY
    : null;
}

export function inferRarityFromWoundCritTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:wound-crit")) return null;
  const die = parseWoundCritDie(text);
  return die >= 8 ? INLINE_WOUND_CRIT_RARITY[2] : INLINE_WOUND_CRIT_RARITY[1];
}

export function inferRarityFromUnarmedUpgradeTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:unarmed-upgrade")) return null;
  const die = parseUnarmedUpgradeDie(text);
  return die >= 8
    ? INLINE_UNARMED_UPGRADE_RARITY[2]
    : INLINE_UNARMED_UPGRADE_RARITY[1];
}

export function inferRarityFromPrehensileTailTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:prehensile-tail")
    ? INLINE_PREHENSILE_TAIL_RARITY
    : null;
}

export function inferRarityFromHealingReductionTags(
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:healing-reduction")) return null;
  return tags.includes("mechanic:healing-reduction:major")
    ? INLINE_HEALING_REDUCTION_MAJOR_RARITY
    : INLINE_HEALING_REDUCTION_RARITY;
}

export function inferRarityFromCraftingMaxTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:crafting-max")
    ? INLINE_CRAFTING_MAX_RARITY
    : null;
}

export function inferRarityFromGoldDoubleTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:gold-double")
    ? INLINE_GOLD_DOUBLE_RARITY
    : null;
}

export function inferRarityFromAbilityScoreSetTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:ability-score-set")) return null;
  const score = parseAbilityScoreSet(text);
  if (score == null) return "Very Rare";
  if (score >= 27) return "Legendary";
  if (score >= 23) return "Very Rare";
  if (score >= 19) return "Rare";
  return "Uncommon";
}

export function inferRarityFromCreatureSenseTags(
  tags: string[],
): ResourceRarity | null {
  if (tags.includes("mechanic:web-sense")) {
    return INLINE_WEB_SENSE_RARITY;
  }
  return tags.includes("mechanic:creature-sense")
    ? INLINE_CREATURE_SENSE_RARITY
    : null;
}

export function inferRarityFromHiddenSenseTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:hidden-sense")
    ? INLINE_HIDDEN_SENSE_RARITY
    : null;
}

export function inferRarityFromNoOpportunityAttacksTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:no-opportunity-attacks")
    ? INLINE_NO_OPPORTUNITY_ATTACKS_RARITY
    : null;
}

export function inferRarityFromSaveRerollTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:save-reroll")
    ? INLINE_SAVE_REROLL_RARITY
    : null;
}

export function inferRarityFromSaveFailureMarginTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:save-failure-margin")
    ? INLINE_SAVE_FAILURE_MARGIN_RARITY
    : null;
}

export function inferRarityFromHpSacrificeTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:hp-sacrifice")
    ? INLINE_HP_SACRIFICE_RARITY
    : null;
}

export function inferRarityFromWeaponClassModeTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:weapon-class-mode")
    ? INLINE_WEAPON_CLASS_MODE_RARITY
    : null;
}

export function inferRarityFromCompositeEffectTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:composite-effect")
    ? INLINE_COMPOSITE_EFFECT_RARITY
    : null;
}

export function inferRarityFromChargeMovementTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:charge-movement")
    ? INLINE_CHARGE_MOVEMENT_RARITY
    : null;
}

export function inferRarityFromConsumableExtendTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:consumable-extend")
    ? INLINE_CONSUMABLE_EXTEND_RARITY
    : null;
}

export function inferRarityFromSignalFlareTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:signal-flare")) return null;
  return /impose disadvantage on the attack roll/i.test(text)
    ? INLINE_SIGNAL_FLARE_MAJOR_RARITY
    : INLINE_SIGNAL_FLARE_RARITY;
}

export function inferRarityFromIceReservoirTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  if (!tags.includes("mechanic:ice-reservoir")) return null;
  if (/15-foot radius/i.test(text) && /bonus action/i.test(text)) {
    return INLINE_ICE_RESERVOIR_MAJOR_RARITY;
  }
  return INLINE_ICE_RESERVOIR_RARITY;
}

export function inferRarityFromBlightSwapTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:blight-swap")
    ? INLINE_BLIGHT_SWAP_RARITY
    : null;
}

export function inferRarityFromAmmoCapacityTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:ammo-capacity")
    ? INLINE_AMMO_CAPACITY_RARITY
    : null;
}

export function inferRarityFromDisplacementTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:displacement")
    ? INLINE_DISPLACEMENT_RARITY
    : null;
}

export function inferRarityFromCarveCheckTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:carve") ? INLINE_CARVE_CHECK_RARITY : null;
}

export function inferRarityFromCreatureProximityTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:creature-proximity")
    ? INLINE_CREATURE_PROXIMITY_RARITY
    : null;
}

export function inferRarityFromHealSelfBoostTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:heal-self-boost")
    ? INLINE_HEAL_SELF_BOOST_RARITY
    : null;
}

export function inferRarityFromAllyReactionMoveTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:ally-reaction-move")
    ? INLINE_ALLY_REACTION_MOVE_RARITY
    : null;
}

export function inferRarityFromTrapPlacementTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:trap") ? INLINE_TRAP_PLACEMENT_RARITY : null;
}

/** Picks the highest rarity from special-effect tag inferences. */
export function highestSpecialEffectRarity(
  text: string,
  tags: string[],
): ResourceRarity | null {
  const candidates: (ResourceRarity | null)[] = [
    inferRarityFromGenericSaveBonusTags(text, tags),
    inferRarityFromPoisonDcBoostTags(text, tags),
    inferRarityFromSaveDcBoostTags(text, tags),
    inferRarityFromConjureItemTags(tags),
    inferRarityFromForcedMovementReductionTags(tags),
    inferRarityFromHerbConsumptionTags(tags),
    inferRarityFromConsumableShareTags(tags),
    inferRarityFromAmmoUnlockTags(tags),
    inferRarityFromMissTriggerTags(tags),
    inferRarityFromInspirationTags(tags),
    inferRarityFromHourlyRechargeTags(tags),
    inferRarityFromMagicResistanceTags(tags),
    inferRarityFromCritNegationTags(tags),
    inferRarityFromForcedPullTags(tags),
    inferRarityFromPushOnHitTags(tags),
    inferRarityFromChargeAttackTags(tags),
    inferRarityFromHelpActionTags(tags),
    inferRarityFromMaterialSenseTags(tags),
    inferRarityFromImprovisedProficiencyTags(tags),
    inferRarityFromExtraAttackTags(tags),
    inferRarityFromHarmfulGasSaveTags(tags),
    inferRarityFromJumpMovementTags(tags),
    inferRarityFromExhaustionMitigationTags(tags),
    inferRarityFromElementalExtraDieTags(tags),
    inferRarityFromPlaneShiftTags(tags),
    inferRarityFromWeaponModeSwitchTags(tags),
    inferRarityFromItemTransformTags(tags),
    inferRarityFromAllyAuraTags(tags),
    inferRarityFromAllyThrowTags(tags),
    inferRarityFromPowerhouseTags(tags),
    inferRarityFromSummonTags(tags),
    inferRarityFromDamageTypeShiftTags(tags),
    inferRarityFromDragonpiercerTags(text, tags),
    inferRarityFromCritNoReactionsTags(tags),
    inferRarityFromResistanceBypassTags(tags),
    inferRarityFromDegradingAcTags(text, tags),
    inferRarityFromConditionalAcTags(text, tags),
    inferRarityFromHealingRerollTags(tags),
    inferRarityFromWoundCritTags(text, tags),
    inferRarityFromUnarmedUpgradeTags(text, tags),
    inferRarityFromPrehensileTailTags(tags),
    inferRarityFromHealingReductionTags(tags),
    inferRarityFromCraftingMaxTags(tags),
    inferRarityFromGoldDoubleTags(tags),
    inferRarityFromAbilityScoreSetTags(text, tags),
    inferRarityFromCreatureSenseTags(tags),
    inferRarityFromHiddenSenseTags(tags),
    inferRarityFromNoOpportunityAttacksTags(tags),
    inferRarityFromSaveRerollTags(tags),
    inferRarityFromSaveFailureMarginTags(tags),
    inferRarityFromHpSacrificeTags(tags),
    inferRarityFromWeaponClassModeTags(tags),
    inferRarityFromCompositeEffectTags(tags),
    inferRarityFromChargeMovementTags(tags),
    inferRarityFromConsumableExtendTags(tags),
    inferRarityFromSignalFlareTags(text, tags),
    inferRarityFromIceReservoirTags(text, tags),
    inferRarityFromBlightSwapTags(tags),
    inferRarityFromAmmoCapacityTags(tags),
    inferRarityFromDisplacementTags(tags),
    inferRarityFromCarveCheckTags(tags),
    inferRarityFromCreatureProximityTags(tags),
    inferRarityFromHealSelfBoostTags(tags),
    inferRarityFromAllyReactionMoveTags(tags),
    inferRarityFromTrapPlacementTags(tags),
  ];

  let best: ResourceRarity | null = null;
  for (const rarity of candidates) {
    if (!rarity) continue;
    best = best ? higherRarity(best, rarity) : rarity;
  }
  return best;
}
