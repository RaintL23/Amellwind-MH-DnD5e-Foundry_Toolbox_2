import type { MaterialEffectSlot } from "@/shared/types";
import type { ResourceRarity } from "@/shared/types";

export type MaterialEffectFiltersState = {
  name: string;
  slot: MaterialEffectSlot[];
  rarity: ResourceRarity[];
};

export const MATERIAL_EFFECT_RARITIES: ResourceRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
];

/** Always-on damage resistance in rune text (Armor of Resistance / Ring of Resistance). */
export const INLINE_DAMAGE_RESISTANCE_RARITY: ResourceRarity = "Rare";

/** Always-on damage immunity in rune text (one step above resistance). */
export const INLINE_DAMAGE_IMMUNITY_RARITY: ResourceRarity = "Very Rare";

/** Always-on flat damage reduction (-N while wearing), weaker than resistance. */
export const INLINE_FLAT_DAMAGE_REDUCTION_RARITY: ResourceRarity = "Uncommon";

/** Limited flat DR (uses per rest, dice pools). One step above always-on Uncommon. */
export const INLINE_LIMITED_FLAT_DAMAGE_REDUCTION_RARITY: ResourceRarity = "Rare";

/**
 * Activated / limited resistance (reaction, bonus action, or action; short duration;
 * uses per rest). Common Amellwind pattern — one step below always-on Rare.
 */
export const INLINE_LIMITED_DAMAGE_RESISTANCE_RARITY: ResourceRarity = "Uncommon";

/** Limited/activated damage immunity — one step below always-on Very Rare. */
export const INLINE_LIMITED_DAMAGE_IMMUNITY_RARITY: ResourceRarity = "Rare";

/**
 * Always-on "extra NdX damage" weapon text, by dice score (n × faces or flat amount).
 * Aligns with Dragon's Wrath / Flame Tongue-style scaling and rune `extra-damage` tags.
 */
export const INLINE_EXTRA_DAMAGE_RARITY_BY_SCORE: Array<{
  maxScore: number;
  rarity: ResourceRarity;
}> = [
  { maxScore: 6, rarity: "Uncommon" },
  { maxScore: 12, rarity: "Rare" },
  { maxScore: 20, rarity: "Very Rare" },
];

export const INLINE_EXTRA_DAMAGE_LEGENDARY_RARITY: ResourceRarity = "Legendary";

/**
 * Once-per-day (or similar) spell cast or expended-slot recovery from a rune,
 * by spell / slot level. Common floor for cantrips / 1st-level grants; higher
 * levels step up (2nd–3rd Uncommon, 4th–5th Rare, …).
 */
export const INLINE_SPELL_CAST_RARITY_BY_LEVEL: Array<{
  maxLevel: number;
  rarity: ResourceRarity;
}> = [
  { maxLevel: 1, rarity: "Common" },
  { maxLevel: 3, rarity: "Uncommon" },
  { maxLevel: 5, rarity: "Rare" },
  { maxLevel: 8, rarity: "Very Rare" },
];

export const INLINE_SPELL_CAST_LEGENDARY_RARITY: ResourceRarity = "Legendary";

/**
 * Nat-20 rider (~5%) whose only payoff is a push and no extra damage.
 * Weaker than even a 1/day cantrip, so it sits at Common.
 */
export const INLINE_ROLL20_PUSH_NO_DAMAGE_RARITY: ResourceRarity = "Common";

/**
 * Reaction to make an attack with a natural weapon or unarmed strike
 * (no listed extra dice). Similar action economy to limited resistance.
 */
export const INLINE_REACTION_ATTACK_RARITY: ResourceRarity = "Uncommon";

/**
 * Extended hold-breath underwater (twice as long). Mild always-on utility —
 * weaker than full water breathing + swim speed.
 */
export const INLINE_HOLD_BREATH_UNDERWATER_RARITY: ResourceRarity = "Common";

/**
 * Always-on basic temperature tolerance (-20 °F cold or 120 °F heat).
 * Weaker than a Hot Drink / Cool Drink consumable.
 */
export const INLINE_BASIC_TEMPERATURE_TOLERANCE_RARITY: ResourceRarity = "Common";

/**
 * Hot Drink–equivalent cold tolerance (-50 °F / -100 °F with heavy clothes).
 */
export const INLINE_EXTENDED_COLD_TOLERANCE_RARITY: ResourceRarity = "Uncommon";

/**
 * Always-on dual hot + cold tolerance (Adaptability, extreme cold/heat aura).
 */
export const INLINE_DUAL_TEMPERATURE_TOLERANCE_RARITY: ResourceRarity = "Rare";

/** Always-on +N to all saving throws (Cloak of Protection–adjacent). */
export const INLINE_GENERIC_SAVE_BONUS_RARITY: ResourceRarity = "Uncommon";

/** Advantage on saves vs spells / magical effects (Mantle of Spell Resistance–adjacent). */
export const INLINE_MAGIC_RESISTANCE_RARITY: ResourceRarity = "Rare";

/** Stronger package: magic resistance + spell attacks have disadvantage against you. */
export const INLINE_MAGIC_RESISTANCE_MAJOR_RARITY: ResourceRarity = "Very Rare";

/** Incoming critical hits become normal hits (Adamantine-adjacent). */
export const INLINE_CRIT_NEGATION_RARITY: ResourceRarity = "Rare";

/** Bonus-action forced pull on a ranged weapon hit. */
export const INLINE_FORCED_PULL_RARITY: ResourceRarity = "Uncommon";

/** Jump-and-grab movement does not consume movement for the turn. */
export const INLINE_JUMP_MOVEMENT_RARITY: ResourceRarity = "Common";

/** Ignore the first N levels of exhaustion (partial mitigation). */
export const INLINE_EXHAUSTION_MITIGATION_RARITY: ResourceRarity = "Rare";

/** Roll one additional elemental damage die on hit (Elemental Atk Up). */
export const INLINE_ELEMENTAL_EXTRA_DIE_RARITY: ResourceRarity = "Uncommon";

/** Interplanar travel (Elemental Plane, plane shift wording). */
export const INLINE_PLANE_SHIFT_RARITY: ResourceRarity = "Very Rare";

/** Flavor-only upkeep / appearance with no mechanical benefit. */
export const INLINE_FLAVOR_COSMETIC_RARITY: ResourceRarity = "Common";

/** Free weapon mode switch (Rapid Morph — Charge Blade / Switchaxe). */
export const INLINE_WEAPON_MODE_SWITCH_RARITY: ResourceRarity = "Common";

/** Action transform into utility item (telescope / magnifying glass). */
export const INLINE_ITEM_TRANSFORM_RARITY: ResourceRarity = "Common";

/** NPC ally aura (+AC / +attack within N ft — Palamute Rally). */
export const INLINE_ALLY_AURA_RARITY: ResourceRarity = "Uncommon";

/** Throw a willing ally (Dwarf Thrower). */
export const INLINE_ALLY_THROW_RARITY: ResourceRarity = "Rare";

/** Reaction AC miss rider → next attack deals PB damage (Powerhouse). */
export const INLINE_POWERHOUSE_RARITY: ResourceRarity = "Uncommon";

/** Summon allies with multi-day recharge. */
export const INLINE_SUMMON_EXTENDED_RARITY: ResourceRarity = "Rare";

/** Temporary weapon damage-type shift (e.g. fire for 1 hour). */
export const INLINE_DAMAGE_TYPE_SHIFT_RARITY: ResourceRarity = "Uncommon";

/** Extra dragonpiercer uses between rests (+1 / +2 / +3). */
export const INLINE_DRAGONPIERCER_EXTRA_USES_RARITY: ResourceRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
];

/** Crit rider: target cannot take reactions until its next turn. */
export const INLINE_CRIT_NO_REACTIONS_RARITY: ResourceRarity = "Uncommon";

/** Spells bypass damage resistance (not immunity). */
export const INLINE_SPELL_BYPASS_RESISTANCE_RARITY: ResourceRarity = "Uncommon";

/** Spells bypass resistance and immunities. */
export const INLINE_SPELL_BYPASS_IMMUNITY_RARITY: ResourceRarity = "Rare";

/** Weapon attacks bypass all damage resistances (Mind's Eye). */
export const INLINE_ATTACK_BYPASS_RESISTANCE_RARITY: ResourceRarity = "Rare";

/** Weapon attacks bypass resistances and immunities (Mind's Eye+). */
export const INLINE_ATTACK_BYPASS_IMMUNITY_RARITY: ResourceRarity = "Very Rare";

/** Degrading AC coating (mud shell — max +3, chips on hit). */
export const INLINE_DEGRADING_AC_RARITY: ResourceRarity = "Rare";

/** Reroll 1s/2s on self magical healing dice (Hasten Recovery). */
export const INLINE_HEALING_REROLL_RARITY: ResourceRarity = "Uncommon";

/** Wound crit burst (Flayer d6 / Flayer+ d8). Index 0 unused; d6 → Rare, d8+ → Very Rare. */
export const INLINE_WOUND_CRIT_RARITY: ResourceRarity[] = [
  "Common",
  "Rare",
  "Very Rare",
];

/** Unarmed damage-type swap + bigger die (d6 / d8 tiers). */
export const INLINE_UNARMED_UPGRADE_RARITY: ResourceRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
];

/** Prehensile tail for object manipulation (not combat limbs). */
export const INLINE_PREHENSILE_TAIL_RARITY: ResourceRarity = "Uncommon";

/** Enemy healing halved on hit (Razor Sharp). */
export const INLINE_HEALING_REDUCTION_RARITY: ResourceRarity = "Uncommon";

/** Razor Sharp+ — also blocks HP regain on crit. */
export const INLINE_HEALING_REDUCTION_MAJOR_RARITY: ResourceRarity = "Rare";

/** Crafting success yields maximum output (Combination Pro). */
export const INLINE_CRAFTING_MAX_RARITY: ResourceRarity = "Uncommon";

/** Hunt reward gold doubles while attuned (Filthy Rich). */
export const INLINE_GOLD_DOUBLE_RARITY: ResourceRarity = "Rare";

/** Blindsight-like creature sense within N ft (Psychic Vision). */
export const INLINE_CREATURE_SENSE_RARITY: ResourceRarity = "Rare";

/** Always-on blindsight out to 10 ft or less (Girros snake eyes). */
export const INLINE_BLINDSIGHT_MINOR_RARITY: ResourceRarity = "Uncommon";

/** Always-on blindsight beyond 10 ft. */
export const INLINE_BLINDSIGHT_MAJOR_RARITY: ResourceRarity = "Rare";

/** Limited truesight activation (command word, long rest). */
export const INLINE_TRUESIGHT_LIMITED_RARITY: ResourceRarity = "Rare";

/** Always-on truesight without a recharge gate. */
export const INLINE_TRUESIGHT_ALWAYS_RARITY: ResourceRarity = "Very Rare";

/** Cloak of Displacement–style attack disadvantage until hit. */
export const INLINE_DISPLACEMENT_RARITY: ResourceRarity = "Rare";

/** MH carve-check advantage or flat bonus (Gendrome, Kirin favor). */
export const INLINE_CARVE_CHECK_RARITY: ResourceRarity = "Uncommon";

/** Armor glows when specific creatures are within range. */
export const INLINE_CREATURE_PROXIMITY_RARITY: ResourceRarity = "Common";

/** Self-heal boost when regaining HP from a spell (Cleric / Paladin armor). */
export const INLINE_HEAL_SELF_BOOST_RARITY: ResourceRarity = "Uncommon";

/** On-hit ally reaction move without OAs from the target (Great Izuchi). */
export const INLINE_ALLY_REACTION_MOVE_RARITY: ResourceRarity = "Rare";

/** Bonus-action MH trap placement (pitfall / shock). */
export const INLINE_TRAP_PLACEMENT_RARITY: ResourceRarity = "Uncommon";

/** Doubled consumable duration + drops concentration (Everlasting). */
export const INLINE_CONSUMABLE_EXTEND_RARITY: ResourceRarity = "Rare";

/** Harmless signal flare (visible 1 mile). */
export const INLINE_SIGNAL_FLARE_RARITY: ResourceRarity = "Common";

/** Signal flare with reaction flash disadvantage rider. */
export const INLINE_SIGNAL_FLARE_MAJOR_RARITY: ResourceRarity = "Uncommon";

/** Planted ice reservoir — action / smaller radius. */
export const INLINE_ICE_RESERVOIR_RARITY: ResourceRarity = "Uncommon";

/** Ice reservoir — bonus-action 15-ft pool up to 1 minute. */
export const INLINE_ICE_RESERVOIR_MAJOR_RARITY: ResourceRarity = "Rare";

/** Blight condition swap on coated ammo (Bow / Bowgun variants). */
export const INLINE_BLIGHT_SWAP_RARITY: ResourceRarity = "Uncommon";

/** Doubled bowgun ammo + extra coating capacity (Ammo Up). */
export const INLINE_AMMO_CAPACITY_RARITY: ResourceRarity = "Uncommon";

/** Specific terrain difficult-terrain immunity (muddy / swamp). */
export const INLINE_TERRAIN_IMMUNITY_RARITY: ResourceRarity = "Common";

/**
 * Always-on shortened long/short rest (benefits after 4h instead of 8).
 * Stronger than mild skill utility; aligns with darkvision / gather x2.
 */
export const INLINE_ACCELERATED_REST_RARITY: ResourceRarity = "Uncommon";

/**
 * Mithral Armor–style package (no Stealth disadvantage + no Str requirement).
 * Matches DMG Mithral Armor at Uncommon.
 */
export const INLINE_MITHRAL_ARMOR_RARITY: ResourceRarity = "Uncommon";

/**
 * MH field gather that doubles a single resource type (Botanist / Expert Fisherman).
 * Core hunt-loop utility — Uncommon floor.
 */
export const INLINE_GATHER_RESOURCES_RARITY: ResourceRarity = "Uncommon";

/**
 * Stronger gather (extra 1d4, party double, free gather on high check).
 * One step above the x2 base skills.
 */
export const INLINE_GATHER_RESOURCES_MAJOR_RARITY: ResourceRarity = "Rare";

/**
 * Once-per-rest recovery of a class pool (ki / Channel Divinity–style).
 * Aligns with unleveled spell-slot recovery (Arcane Recovery boost) at Uncommon.
 */
export const INLINE_CLASS_RESOURCE_RECOVERY_RARITY: ResourceRarity = "Uncommon";

/**
 * Flat attack-range bump (Deadeye +20 ft). Mild always-on utility.
 */
export const INLINE_ATTACK_RANGE_RARITY: ResourceRarity = "Common";

/**
 * Doubled normal attack range (Deadeye+ / underwater). One step above +N ft.
 */
export const INLINE_ATTACK_RANGE_MAJOR_RARITY: ResourceRarity = "Uncommon";

/**
 * Limited-use advantage on an attack roll (Aim Booster: BA, ½ PB / long rest).
 * Always-on attack advantage sits one step higher.
 */
export const INLINE_ATTACK_ADVANTAGE_LIMITED_RARITY: ResourceRarity = "Uncommon";

/** Always-on advantage on attack rolls (no action economy / rest gate). */
export const INLINE_ATTACK_ADVANTAGE_ALWAYS_RARITY: ResourceRarity = "Rare";

/**
 * Always-on alternate movement modes (burrow / swim / climb) or +10 ft walk.
 */
export const INLINE_MOVEMENT_MODE_RARITY: ResourceRarity = "Uncommon";

/** Mild walk bump (+5 ft Marathon Runner). */
export const INLINE_WALKING_SPEED_MINOR_RARITY: ResourceRarity = "Common";

/**
 * Ice/snow surface mobility (Boots of the Winterlands–adjacent: climb icy
 * surfaces without checks + ignore ice/snow difficult terrain).
 */
export const INLINE_ICY_SURFACES_RARITY: ResourceRarity = "Uncommon";

/** Always-on flying speed below 60 ft (Winged Boots–adjacent). */
export const INLINE_FLYING_SPEED_RARITY: ResourceRarity = "Rare";

/** Always-on flying speed 60+ ft. */
export const INLINE_FLYING_SPEED_MAJOR_RARITY: ResourceRarity = "Very Rare";

/**
 * Always-on advantage or flat save bonus against one condition (e.g. poisoned,
 * knocked prone). Milder than condition immunity; Common floor for unnamed
 * inline text.
 */
export const INLINE_CONDITION_SAVE_ADVANTAGE_RARITY: ResourceRarity = "Common";

/**
 * Always-on flat skill bonus (+2 Athletics) or advantage on a skill / vs disarm.
 * Mild utility — Common floor for unnamed inline text.
 */
export const INLINE_SKILL_UTILITY_RARITY: ResourceRarity = "Common";

/**
 * Always-on immunity to a named condition (poisoned, stunned, …).
 * Stronger than save advantage; below always-on damage immunity (Rare+).
 */
export const INLINE_CONDITION_IMMUNITY_RARITY: ResourceRarity = "Uncommon";

/**
 * Always-on cleanse of damage-over-time at the start of your turn
 * (Recovery Level). Stronger than single-condition immunity (Uncommon);
 * below always-on damage resistance (Rare) is a wash — Rare floor.
 */
export const INLINE_END_DOT_RARITY: ResourceRarity = "Rare";

/**
 * Always-on advantage on initiative rolls (Rejuvenated Beak–style).
 * Weaker than always-on attack advantage (Rare); Uncommon floor.
 */
export const INLINE_INITIATIVE_ADVANTAGE_RARITY: ResourceRarity = "Uncommon";

/**
 * Strong initiative control: flat die bonus (d8+) and/or force first in order
 * (Safi'jiiva Fellwing–style).
 */
export const INLINE_INITIATIVE_MAJOR_RARITY: ResourceRarity = "Rare";

/**
 * Buffs to healing you provide to other creatures (Astalos Scissortail +spell
 * level, Lay on Hands THP rider). Minor = small additive / single-target THP.
 */
export const INLINE_HEAL_OTHER_MINOR_RARITY: ResourceRarity = "Uncommon";

/**
 * Stronger outgoing-heal packages (double spell level, shared THP, HP-transfer
 * heals). One step above minor.
 */
export const INLINE_HEAL_OTHER_MAJOR_RARITY: ResourceRarity = "Rare";

/**
 * Mild always-on illumination (shed bright/dim light, Moon-touched–style).
 * Weaker than darkvision; Common floor.
 */
export const INLINE_LIGHT_RARITY: ResourceRarity = "Common";

/**
 * Weapon usable as a spellcasting focus (Ruby of the War Mage–adjacent).
 * Mild caster utility — Common floor.
 */
export const INLINE_SPELLCASTING_FOCUS_RARITY: ResourceRarity = "Common";

/**
 * MHMM "(Cosmetic)" effects — visual / flavor only, no mechanical benefit.
 */
export const INLINE_COSMETIC_RARITY: ResourceRarity = "Common";

/**
 * Flat +N to AC or to spell attack / spell save DC (Cloak of Protection /
 * Rod of the Pact Keeper–adjacent). Index 0 unused; amounts ≥ table length
 * use the last band.
 */
export const INLINE_FLAT_BONUS_ALWAYS_RARITY: ResourceRarity[] = [
  "Common", // placeholder for 0
  "Uncommon", // +1
  "Rare", // +2
  "Very Rare", // +3
  "Legendary", // +4+
];

/** Limited / reaction / short-duration flat bonus — one step below always-on. */
export const INLINE_FLAT_BONUS_LIMITED_RARITY: ResourceRarity[] = [
  "Common", // placeholder for 0
  "Common", // +1
  "Uncommon", // +2
  "Rare", // +3
  "Very Rare", // +4+
];

/**
 * Always-on darkvision grant (Goggles of Night–adjacent).
 */
export const INLINE_DARKVISION_RARITY: ResourceRarity = "Uncommon";

/**
 * See normally in magical darkness (Devil's Sight–adjacent / Gaismagorm).
 * One step above plain darkvision.
 */
export const INLINE_MAGICAL_DARKNESS_SIGHT_RARITY: ResourceRarity = "Rare";

/**
 * Light-snuffing / dim-to-dark manipulation (draws in light, snuffs flames).
 * Mild environmental utility — same floor as producing light.
 */
export const INLINE_LIGHT_SUPPRESSION_RARITY: ResourceRarity = "Common";

/**
 * Activated darkness utility (Hide as a bonus action in dim light / darkness).
 * Stronger than passive light manipulation — Uncommon floor.
 */
export const INLINE_DARKNESS_UTILITY_RARITY: ResourceRarity = "Uncommon";

/**
 * DMG-aligned tiers for replicated giant-strength potion weapon properties.
 */
export const INLINE_POTION_EFFECT_RARITY_BY_GIANT: Record<
  "hill" | "frostStone" | "fire" | "cloud" | "storm",
  ResourceRarity
> = {
  hill: "Uncommon",
  frostStone: "Rare",
  fire: "Rare",
  cloud: "Very Rare",
  storm: "Legendary",
};

export const INLINE_POTION_EFFECT_RARITY_DEFAULT: ResourceRarity = "Uncommon";

/**
 * Unarmored base AC by score (Magala carapace: 13–15 + Dex).
 */
export const INLINE_BASE_AC_RARITY_BY_SCORE: Array<{
  maxScore: number;
  rarity: ResourceRarity;
}> = [
  { maxScore: 13, rarity: "Uncommon" },
  { maxScore: 14, rarity: "Rare" },
  { maxScore: 15, rarity: "Very Rare" },
];

/**
 * Bonus-action extra-limb unarmed strike packages (Magala Nyctgem).
 */
export const INLINE_EXTRA_LIMBS_RARITY: ResourceRarity = "Uncommon";

/** Periodic self-healing (1d4–1d6 every 10+ minutes). */
export const INLINE_HEALING_MINOR_RARITY: ResourceRarity = "Uncommon";

/** Regeneration of lost body parts / major healing packages. */
export const INLINE_HEALING_MAJOR_RARITY: ResourceRarity = "Very Rare";

/** On-hit forced movement via ability check (push / pull). */
export const INLINE_PUSH_ON_HIT_RARITY: ResourceRarity = "Uncommon";

/** Once-per-turn bonus weapon attack (Barbarian reckless rider, …). */
export const INLINE_EXTRA_ATTACK_RARITY: ResourceRarity = "Rare";

/** Conditional +N to attack rolls (charge / movement gate). */
export const INLINE_CONDITIONAL_ATTACK_BONUS_RARITY: ResourceRarity = "Uncommon";

/** Always-on +1 to an ability score (Gauntlets / Headband–adjacent). */
export const INLINE_ABILITY_SCORE_INCREASE_RARITY: ResourceRarity = "Uncommon";

/** Nat-20 rider with no extra damage (fruit spawn, push-only, etc.). */
export const INLINE_ROLL20_NO_DAMAGE_RARITY: ResourceRarity = "Common";

/** Extra class-feature use between rests (Mighty Weapon, Channel Divinity, …). */
export const INLINE_CLASS_FEATURE_EXTRA_USE_RARITY: ResourceRarity = "Uncommon";

/** Help-action ally weapon buff (+1 magic weapon rider). */
export const INLINE_HELP_ACTION_RARITY: ResourceRarity = "Uncommon";

/** Activated sense for buried / hidden field materials. */
export const INLINE_MATERIAL_SENSE_RARITY: ResourceRarity = "Uncommon";

/** Improvised-weapon proficiency while attuned. */
export const INLINE_PROFICIENCY_IMPROVISED_RARITY: ResourceRarity = "Common";

/** Breathe normally in any environment (not just underwater). */
export const INLINE_BREATHE_ANY_ENVIRONMENT_RARITY: ResourceRarity = "Common";

/** Advantage on saves vs harmful gases / vapors / inhaled hazards. */
export const INLINE_HARMFUL_GAS_SAVE_ADVANTAGE_RARITY: ResourceRarity = "Uncommon";

/** Gliding membrane / controlled descent (Feather Fall–adjacent). */
export const INLINE_GLIDE_RARITY: ResourceRarity = "Uncommon";

/** Strong Winds environmental immunity (DMG p.110). */
export const INLINE_WIND_RESIST_RARITY: ResourceRarity = "Common";

/** Suppress a named condition while an item is used (Earplugs / Kut-Ku horn). */
export const INLINE_CONDITION_SUPPRESS_RARITY: ResourceRarity = "Uncommon";

/** Temporary language proficiency via command phrase. */
export const INLINE_LANGUAGE_PROFICIENCY_RARITY: ResourceRarity = "Uncommon";

/** Bonus-action Disengage or Hide (Xu Wu–style). */
export const INLINE_DISENGAGE_HIDE_RARITY: ResourceRarity = "Uncommon";

/** Creatures have disadvantage when trying to track the wearer. */
export const INLINE_ANTI_TRACKING_RARITY: ResourceRarity = "Uncommon";

/** Advantage on skill checks to resist grapple escape. */
export const INLINE_GRAPPLE_CONTEST_RARITY: ResourceRarity = "Common";

/** Reaction invisibility after taking damage. */
export const INLINE_INVISIBILITY_REACTION_RARITY: ResourceRarity = "Rare";

/** Long-rest exhaustion reduction beyond the normal 1 level. */
export const INLINE_EXHAUSTION_RECOVERY_MAJOR_RARITY: ResourceRarity = "Very Rare";

/** Conditional movement speed boost after hitting a creature. */
export const INLINE_CONDITIONAL_SPEED_RARITY: ResourceRarity = "Uncommon";

/** Extends psychoserum / similar consumable duration by additional days. */
export const INLINE_PSYCHOSERUM_EXTEND_RARITY: ResourceRarity = "Uncommon";

/** Always-on proficiency in one skill while attuned. */
export const INLINE_PROFICIENCY_SKILL_RARITY: ResourceRarity = "Common";

/** Always-on tool / kit proficiency (Handicraft, herbalism kit). */
export const INLINE_PROFICIENCY_TOOL_RARITY: ResourceRarity = "Common";

/** Always-on instrument proficiency. */
export const INLINE_PROFICIENCY_INSTRUMENT_RARITY: ResourceRarity = "Common";

/** Double proficiency bonus when already proficient (expertise-style). */
export const INLINE_EXPERTISE_RARITY: ResourceRarity = "Uncommon";

/** Long-rest skill check that grants heroic inspiration. */
export const INLINE_INSPIRATION_RARITY: ResourceRarity = "Uncommon";

/** Coat weapon with poison → save DC boost (+1 … +5 by amount). Index 0 unused. */
export const INLINE_POISON_DC_BOOST_RARITY: ResourceRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Very Rare",
];

/** Save DC for condition-causing effects / material effects (+1 … +4 by amount). */
export const INLINE_SAVE_DC_BOOST_RARITY: ResourceRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
];

/** Reaction to reduce forced movement along the ground. */
export const INLINE_FORCED_MOVEMENT_REDUCTION_RARITY: ResourceRarity = "Uncommon";

/** Action conjure temporary consumable item (horns, earplugs). */
export const INLINE_CONJURE_ITEM_RARITY: ResourceRarity = "Uncommon";

/** Always-on resistance to all nonmagical damage. */
export const INLINE_NONMAGICAL_DAMAGE_RESISTANCE_RARITY: ResourceRarity = "Legendary";

/** Activated short-duration immunity to nonmagical damage. */
export const INLINE_NONMAGICAL_DAMAGE_IMMUNITY_LIMITED_RARITY: ResourceRarity =
  "Very Rare";

/** Herb consumption die upgrade (Pro Herbology). */
export const INLINE_HERB_CONSUMPTION_RARITY: ResourceRarity = "Common";

/** Share consumable effect with allies in radius (Dreadqueen). */
export const INLINE_CONSUMABLE_SHARE_RARITY: ResourceRarity = "Rare";

/** Cross-weapon ammo / ammo-type unlock (Bowgun swap). */
export const INLINE_AMMO_UNLOCK_RARITY: ResourceRarity = "Uncommon";

/** Hunting Horn miss-trigger note elicitation (Jingle). */
export const INLINE_MISS_TRIGGER_RARITY: ResourceRarity = "Uncommon";

/** Hourly recharge utility (extinguish flames on draw). */
export const INLINE_HOURLY_RECHARGE_RARITY: ResourceRarity = "Common";

/** Conditional save bonus vs a specific damage type (+N, not advantage). */
export const INLINE_CONDITIONAL_SAVE_BONUS_RARITY: ResourceRarity = "Uncommon";

/** Melee attack does not provoke opportunity attacks from the target (Ebony Odogaron). */
export const INLINE_NO_OPPORTUNITY_ATTACKS_RARITY: ResourceRarity = "Uncommon";

/** Bonus-action move toward an enemy without spending normal movement. */
export const INLINE_CHARGE_MOVEMENT_RARITY: ResourceRarity = "Uncommon";

/** Bonus-action use of a skill check (Intelligence (History), …). */
export const INLINE_SKILL_BONUS_ACTION_RARITY: ResourceRarity = "Uncommon";

/** Once-per-rest auto-pass a failed saving throw (Fulgur Anjanath evasion). */
export const INLINE_SAVE_REROLL_RARITY: ResourceRarity = "Rare";

/** Extra rider when a save fails by 5+ (Nerscylla poison KO, …). */
export const INLINE_SAVE_FAILURE_MARGIN_RARITY: ResourceRarity = "Rare";

/** Web-linked creature location sense (Nerscylla / Rakna-Kadaki). */
export const INLINE_WEB_SENSE_RARITY: ResourceRarity = "Uncommon";

/** Hidden door / passage detection (Legiana penguin emblem). */
export const INLINE_HIDDEN_SENSE_RARITY: ResourceRarity = "Uncommon";

/** Reduced DC to staunch a wound (Gajios / Odogaron blood wound). */
export const INLINE_WOUND_STAUNCH_RARITY: ResourceRarity = "Common";

/** Max-HP sacrifice for a turn-limited damage boost (Dereliction). */
export const INLINE_HP_SACRIFICE_RARITY: ResourceRarity = "Rare";

/** Always-on MH weapon class mode (Archdemon Mode, …). */
export const INLINE_WEAPON_CLASS_MODE_RARITY: ResourceRarity = "Rare";

/** Stacks two named weapon material effects (Rajang Will). */
export const INLINE_COMPOSITE_EFFECT_RARITY: ResourceRarity = "Rare";

/** HP-threshold flavor transform with no mechanical payoff (Gaismagorm crystals). */
export const INLINE_CONDITIONAL_FLAVOR_RARITY: ResourceRarity = "Common";

/** Extreme cold environment immunity without a °F threshold (Giadrome / Legiana). */
export const INLINE_EXTREME_COLD_IMMUNITY_RARITY: ResourceRarity = "Common";

/** Reroll 1s/2s on weapon or spell damage dice (Peak Performance, Astalos spell rider). */
export const INLINE_DAMAGE_REROLL_RARITY: ResourceRarity = "Uncommon";

/** Reaction position swap with a nearby creature (Redirection). */
export const INLINE_POSITION_SWAP_RARITY: ResourceRarity = "Rare";

/** Trade half damage on hit to grapple (Najarala fang). */
export const INLINE_GRAPPLE_ON_HIT_RARITY: ResourceRarity = "Uncommon";

/** Doubled demon-ammo duration/effect (Magnamalo / Odogaron LBG). */
export const INLINE_AMMO_BUFF_RARITY: ResourceRarity = "Uncommon";

/** Hunting Horn maximum cord length bump. */
export const INLINE_CORD_LENGTH_RARITY: ResourceRarity = "Common";

/** Reduced straight-line distance for hammer charge (Jade Barroth). */
export const INLINE_HAMMER_CHARGE_RARITY: ResourceRarity = "Common";

/** Bow gains a melee blade attack mode (Magnamalo). */
export const INLINE_BOW_MELEE_MODE_RARITY: ResourceRarity = "Uncommon";

/** Reaction shove when hit in melee (Lagiacrus tail armor). */
export const INLINE_REACTION_SHOVE_RARITY: ResourceRarity = "Uncommon";

/** On-hit saving throw rider (Hypnocatrice charm, …). */
export const INLINE_ON_HIT_SAVE_RARITY: ResourceRarity = "Uncommon";

/** Use AC in place of a save while dodging, once per rest (Uragaan Minor Protection). */
export const INLINE_DODGE_AC_SAVE_RARITY: ResourceRarity = "Uncommon";

export const UNKNOWN_MATERIAL_EFFECT_TIER = "Unknown" as const;

export type MaterialEffectTierFilter =
  | ResourceRarity
  | typeof UNKNOWN_MATERIAL_EFFECT_TIER;

export const MATERIAL_EFFECT_TIER_FILTER_OPTIONS: MaterialEffectTierFilter[] =
  [...MATERIAL_EFFECT_RARITIES, UNKNOWN_MATERIAL_EFFECT_TIER];

export const MATERIAL_EFFECT_INTRO =
  "Named material effects from Amellwind's Guide (Monster Hunter Monster Loot Table Material List). These are the reusable effect templates you can assign when creating loot tables — distinct from the rune materials tied to each monster.";
