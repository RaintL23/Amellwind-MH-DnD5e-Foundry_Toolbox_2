/**
 * Global registry of combat-feature automation by normalized feature name.
 * Forge per-feature `automation` overrides win at compile time.
 *
 * Scope (wave 1–2): Mastery (dynamic), gauges, counter_spend (Gather / ×N / scale),
 * mode switches, passive AC/casting, clear reactions / bonus actions / saves /
 * attacks with fixed formulas.
 * Left unmapped: coatings/ammo/magazines resource-column unlocks, ally auras/melodies,
 * mode-gated dual masteries narrative; some on-hit status/saves remain partial.
 */

import { EFFECT_MODE } from "../effects";
import type { WeaponFeatureAutomationSpec } from "./activity.types";
import {
  normalizeFeatureAutomationName,
  stripFeatureAutomationUpgradeSuffix,
} from "./activity-merge";

const WEAPON_MASTERY_IDS = new Set([
  "cleave",
  "graze",
  "nick",
  "push",
  "sap",
  "slow",
  "topple",
  "vex",
]);

function spec(
  template: WeaponFeatureAutomationSpec["template"],
  params: WeaponFeatureAutomationSpec["params"] = {},
  notes?: string,
): WeaponFeatureAutomationSpec {
  return notes ? { template, params, notes } : { template, params };
}

function gauge(
  max: string,
  period?: "sr" | "lr" | "day",
  notes?: string,
  opts?: { startsEmpty?: boolean },
): WeaponFeatureAutomationSpec {
  return spec(
    "resource_gauge",
    {
      itemUsesMax: max,
      ...(period ? { itemUsesRecoveryPeriod: period } : {}),
      ...(opts?.startsEmpty ? { poolStartsEmpty: true } : {}),
    },
    notes,
  );
}

function counterSpend(
  params: WeaponFeatureAutomationSpec["params"],
  notes?: string,
): WeaponFeatureAutomationSpec {
  return spec("counter_spend", params, notes);
}

function scaleUses(max: string): WeaponFeatureAutomationSpec {
  return spec("upgrade_scaler", { itemUsesMax: max });
}

function baUtility(
  condition = "",
  notes?: string,
): WeaponFeatureAutomationSpec {
  return spec(
    "bonus_action",
    {
      activation: "bonus",
      activityType: "utility",
      activationCondition: condition,
    },
    notes,
  );
}

function reactionUtility(
  condition: string,
  extra: WeaponFeatureAutomationSpec["params"] = {},
  notes?: string,
): WeaponFeatureAutomationSpec {
  return spec(
    "reaction",
    {
      activation: "reaction",
      activityType: "utility",
      activationCondition: condition,
      ...extra,
    },
    notes,
  );
}

function reactionAttack(
  condition: string,
  damageFormula: string,
  damageType: string,
  notes?: string,
): WeaponFeatureAutomationSpec {
  return spec(
    "reaction",
    {
      activation: "reaction",
      activityType: "attack",
      activationCondition: condition,
      damageFormula,
      damageType,
      includeBaseDamage: true,
    },
    notes,
  );
}

function saveAction(opts: {
  activation?: "action" | "bonus" | "reaction" | "special";
  saveAbility: string;
  damageFormula?: string;
  damageType?: string;
  onSave?: "half" | "none" | "full";
  templateType?: string;
  templateSize?: string;
  templateWidth?: string;
  usesMax?: string;
  usesRecoveryPeriod?: "lr" | "sr" | "day";
  consumeItemUses?: boolean;
  consumeAmount?: string;
  statuses?: string[];
  chatFlavor?: string;
  notes?: string;
}): WeaponFeatureAutomationSpec {
  return spec(
    "action_ability",
    {
      activation: opts.activation ?? "action",
      activityType: "save",
      saveAbility: opts.saveAbility,
      damageFormula: opts.damageFormula,
      damageType: opts.damageType,
      onSave: opts.onSave ?? "half",
      templateType: opts.templateType,
      templateSize: opts.templateSize,
      templateWidth: opts.templateWidth,
      usesMax: opts.usesMax,
      usesRecoveryPeriod: opts.usesRecoveryPeriod,
      consumeItemUses: opts.consumeItemUses,
      consumeAmount: opts.consumeAmount,
      statuses: opts.statuses,
      chatFlavor: opts.chatFlavor,
    },
    opts.notes,
  );
}

function castingBonus(bonus: string): WeaponFeatureAutomationSpec {
  return spec("passive_stat", {
    effectTransfer: true,
    effectChanges: [
      {
        key: "system.bonuses.spell.dc",
        mode: EFFECT_MODE.ADD,
        value: bonus,
        priority: 20,
      },
      {
        key: "system.bonuses.msak.attack",
        mode: EFFECT_MODE.ADD,
        value: bonus,
        priority: 20,
      },
      {
        key: "system.bonuses.rsak.attack",
        mode: EFFECT_MODE.ADD,
        value: bonus,
        priority: 20,
      },
    ],
  });
}

/**
 * Canonical English combat feature names → default automation.
 * Resource unlocks (Phials/Coatings/Ammo/…) must never be registered here.
 */
export const WEAPON_FEATURE_AUTOMATION_REGISTRY: Record<
  string,
  WeaponFeatureAutomationSpec
> = {
  // ── Gauges / item uses (shared counters) ────────────────────────────
  "phial gauge": gauge("5", undefined, "Phial charges; starts empty; build on hits.", {
    startsEmpty: true,
  }),
  "phial charges": gauge(
    "5",
    undefined,
    "Phial charges; starts empty; dissipates after 1 min idle.",
    { startsEmpty: true },
  ),
  "coating charges": gauge(
    "5",
    "sr",
    "Coating charges; starts empty; regain all on short rest.",
    { startsEmpty: true },
  ),
  "wirebug gauge": gauge("3", "sr", "Wirebugs start full; regain all on short rest."),
  "wirebug whisperer": scaleUses("4"),
  "spirit gauge": gauge(
    "6",
    undefined,
    "Longsword spirit pool; starts empty; build on normal hits; dissipates after 1 min idle. Spends (Blade / Foresight / Thrust / Roundslash / Helm Breaker / Iai) consume uses.",
    { startsEmpty: true },
  ),
  "spirit gauge upgrade ii": spec(
    "unmapped",
    {},
    "Fill rate 2 spirit per normal hit — item uses max stays 6.",
  ),
  "accelerator gauge": gauge("5"),
  "sword gauge": gauge("20"),
  "heat gauge": gauge("3", "sr", "Heat builds when Accelerator charges are spent."),
  "spell core gauge": gauge(
    "3",
    undefined,
    "Spell Counters; starts empty; cleared on short/long rest.",
    { startsEmpty: true },
  ),
  "artillery shells": spec(
    "bonus_action",
    {
      activation: "bonus",
      activityType: "utility",
      itemUsesMax: "4",
      poolStartsEmpty: false,
      consumeItemUses: true,
      // Negative itemUses restores charges (Foundry clamps spent ≥ 0).
      consumeAmount: "-4",
      chatFlavor: "Reload all expended shells.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/weapons/ammunition/bullets-cartridge-shell-gray.webp",
    },
    "Shell capacity as item uses (starts full). BA restores up to 4 via −itemUses.",
  ),
  "expanded gauge": scaleUses("5"),
  "expanded gauge i": scaleUses("7"),
  "expanded gauge ii": scaleUses("9"),
  "expanded gauge upgrade i": scaleUses("7"),
  "expanded gauge upgrade ii": scaleUses("10"),
  "maximum gauge": scaleUses("10"),
  "gauge upgrade i": scaleUses("7"),
  "gauge upgrade ii": scaleUses("9"),
  "gauge upgrade iii": scaleUses("12"),
  "sword gauge upgrade i": scaleUses("30"),
  "sword gauge upgrade ii": scaleUses("40"),
  "sword gauge upgrade iii": scaleUses("50"),
  "shelling upgrade": scaleUses("5"),
  "artillery expert": scaleUses("6"),

  // ── Mode switch ─────────────────────────────────────────────────────
  "switch mode": spec("mode_switch", { activation: "bonus" }),
  "fluid morph": spec("mode_switch", { activation: "bonus" }),

  // ── Passive stats ────────────────────────────────────────────────────
  defense: spec("passive_stat", { acBonus: "1", effectTransfer: true }),
  "defense upgrade i": spec("upgrade_scaler", { acBonus: "2" }),
  "defense upgrade ii": spec("upgrade_scaler", { acBonus: "3" }),
  "improve casting": castingBonus("1"),
  "improve casting upgrade i": castingBonus("2"),
  "improve casting upgrade ii": castingBonus("3"),

  // ── Reactions ───────────────────────────────────────────────────────
  "emergency guard": reactionUtility(
    "When you are hit by a melee attack",
    {
      rollFormula: "1d10 + @abilities.str.mod",
      chatFlavor:
        "+3 AC vs triggering attack; reduce damage by 1d10 + STR on a hit.",
      rangeUnits: "self",
    },
    "Single-attack AC bonus and damage reduction are manual/midi macros; activity exposes the reaction + reduction roll.",
  ),
  "guard (gs)": reactionUtility(
    "When you would be hit by a melee attack you can see",
    { chatFlavor: "+2 AC vs that attack; Disadvantage on attacks until end of your next turn." },
  ),
  "guard upgrade i (gs)": spec("upgrade_scaler", {
    chatFlavor: "+3 AC vs that attack; Disadvantage on attacks until end of your next turn.",
  }),
  "guard upgrade ii (gs)": spec("upgrade_scaler", {
    chatFlavor: "+4 AC vs that attack; Disadvantage on attacks until end of your next turn.",
  }),
  "counter-thrust": reactionUtility(
    "When a creature you can see hits you or an ally within your reach with an attack",
    {
      rollFormula: "1d8",
      chatFlavor: "Add 1d8 to the target's AC against the triggering attack.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/shield-damaged-broken-orange.webp",
    },
    // Utility roll alone does not change AC. Hand-tuned Lance uncommon example embeds
    // ItemMacro [postActiveEffects] that applies system.attributes.ac.bonus + N with
    // dae.specialDuration isAttacked so Midi can recheck the triggering attack.
    "Needs ItemMacro AC AE (see foundry-jsons-example/weapons fvtt-Item-lance-uncommon).",
  ),
  "offset strike": reactionAttack(
    "When a creature moves into your reach and makes a melee attack against you",
    "2d6",
    "slashing",
    "Compare rolls manually: if yours is higher, their attack misses and yours hits with weapon damage + 2d6.",
  ),
  "offset smash": spec(
    "reaction",
    {
      activation: "reaction",
      activityType: "attack",
      includeBaseDamage: true,
      activationCondition:
        "When a creature within your reach misses you with a melee attack",
      chatFlavor: "Make a hammer attack as a reaction.",
    },
    "Include base weapon damage in Foundry.",
  ),
  "demon dodge": reactionUtility(
    "While Demon Mode is active, when you are hit by a melee attack you can see",
    {
      chatFlavor:
        "Add your Proficiency Bonus to AC vs the triggering attack (Midi rechecks). On a miss, move 5 ft without OA.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/movement/figure-running-gray.webp",
    },
    // Utility alone does not change AC. Dual Blades uncommon example embeds ItemMacro
    // [postActiveEffects] that applies system.attributes.ac.bonus + @prof with
    // dae.specialDuration isAttacked (same Shield / Lance Counter-Thrust pattern).
    "Needs ItemMacro AC AE (see foundry-jsons-example/weapons fvtt-Item-dual-blades-uncommon).",
  ),
  "perfect evade": spec(
    "reaction",
    {
      activation: "reaction",
      activityType: "attack",
      includeBaseDamage: true,
      activationCondition:
        "After Demon Dodge causes the triggering attack to miss",
      chatFlavor:
        "After 5 ft of movement: make one melee weapon attack against the attacker.",
      activityImg: "icons/skills/melee/blade-tip-orange.webp",
    },
    "Companion to Demon Dodge (same reaction), Rare+.",
  ),
  "elemental guard": reactionUtility(
    "When you are hit by an attack (Sword mode)",
    {
      activityType: "damage",
      damageFormula: "1d4",
      consumeItemUses: true,
      consumeAmount: "1",
      chatFlavor: "Expend 1 phial: deal 1d4 acid/cold/fire/lightning to the attacker.",
    },
  ),
  "guard point (elemental guard)": reactionUtility(
    "When you are hit by a melee attack while in Sword & Shield Mode",
    {
      // Do NOT consume itemUses here — Midi filters out unpaid reactions.
      // Charge Blade overlay spends 1 Phial Charge in ItemMacro (Lance Shield pattern).
      chatFlavor:
        "Expend 1 phial: +2 AC vs the attack (Midi rechecks). On a miss, Guard Point: Eruption deals elemental damage.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/shield-block-gray-orange.webp",
    },
    // Empty Midi useCondition (default isHit). See applyChargeBladeOverlay.
    "Needs ItemMacro AC AE + Eruption (Lance Counter-Thrust / Shield pattern).",
  ),
  "guard point upgrade i": spec("upgrade_scaler", {
    damageFormula: "1d6",
    chatFlavor: "Guard Point Eruption damage 1d6.",
  }),
  "guard point upgrade ii": spec("upgrade_scaler", {
    damageFormula: "1d8",
    chatFlavor: "Guard Point Eruption damage 1d8.",
  }),
  "offset morph": reactionUtility(
    "When a creature you can see makes a melee attack against you",
    {
      consumeItemUses: true,
      consumeAmount: "1",
      rollFormula: "1d4",
      chatFlavor: "Expend 1 phial; add roll / modifier to AC per Offset Morph text.",
    },
  ),
  "offset ward": reactionUtility(
    "When you are hit by a melee attack",
    {
      consumeItemUses: true,
      consumeAmount: "2",
      chatFlavor: "Expend 2 Spell Counters for magical parry per description.",
    },
  ),
  "guard reload": reactionUtility(
    "When a creature misses you with a melee attack while you are wielding the shield",
    {
      consumeItemUses: true,
      consumeAmount: "-2",
      chatFlavor: "Reload up to 2 expended shells.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/shield-block-gray-orange.webp",
    },
    // Hand-tuned uncommon example: useCondition isMissed melee + ItemMacro Yes/No.
    "Shared Artillery Shells pool. Negative itemUses restores up to 2 (Foundry clamps). See fvtt-Item-gunlance-uncommon ItemMacro.",
  ),
  "counter mine": reactionUtility(
    "When a creature hits you with a melee attack",
    {
      activityType: "damage",
      damageFormula: "3d6",
      damageType: "fire",
      chatFlavor:
        "Embed and detonate Wyvernblast (all 3 detonations = 3× current Wyvernblast die).",
    },
  ),

  // ── Bonus actions ───────────────────────────────────────────────────
  "focus strike": baUtility(
    "",
    "Recover 1 counter on the Charged Slash pool without forgoing an Attack action attack.",
  ),
  "power charge": baUtility("", "Weapon remains charged for 1 minute or until you hit."),
  "guard dash": baUtility("", "Move up to 15 ft without provoking opportunity attacks."),
  "shielding presence": spec(
    "passive_stat",
    {
      effectTransfer: true,
      activeEffect: {
        name: "Shielding Presence (Aura 5 ft)",
        transfer: true,
        showIcon: true,
        disableIncapacitated: true,
        specialDuration: ["isIncapacitated"],
        isAura: true,
        auraTargets: "Allies",
        auraRadius: "5",
        auraIgnoreSelf: true,
        auraDisplayTemp: true,
        changes: [
          { key: "system.attributes.ac.bonus", mode: 2, value: "2", priority: 20 },
          {
            key: "system.abilities.dex.bonuses.save",
            mode: 2,
            value: "2",
            priority: 20,
          },
        ],
      },
    },
    "Requires Active Auras. Half Cover for allies within 5 ft.",
  ),
  "aegis wall": reactionUtility(
    "When you would make a Dexterity saving throw against an area effect while wielding the shield",
    {
      usesMax: "1",
      usesRecoveryPeriod: "lr",
      chatFlavor:
        "Consumes your Reaction. Con save with Advantage instead of Dex. Allies within 15 ft may spend their Reaction to move up to half Speed into the 10-ft cone behind you before the effect resolves. Those in the cone: Con+Adv; success = no damage, fail = half (not you).",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/shield-block-gray-orange.webp",
    },
    "Manual: wielder spends Reaction; Con+Adv vs the effect DC. Allies within 15 ft may spend their Reaction to move half Speed into the 10-ft cone before resolution (no OA). Cone creatures other than the wielder get Evasion-like Con+Adv.",
  ),
  "anchor rage": spec(
    "unmapped",
    {},
    "Granted by Counter-Thrust ItemMacro on miss (Rare+): +1d6 piercing until 1Hit / turnEndSource. See lance-counter-thrust-item-macro.js.",
  ),
  "leaping thrust": spec("bonus_action", {
    activation: "bonus",
    activityType: "attack",
    includeBaseDamage: true,
    activationCondition: "When you use Guard Dash",
    chatFlavor: "Make one Lance attack at the end of Guard Dash movement.",
  }),
  "charging sidestep": baUtility(
    "",
    "Leap up to 15 ft (no OA) and generate 1 Coating Charge.",
  ),
  /**
   * Dual Repeaters: Magazines / Empowered Reload open an ItemMacro dialog that
   * expends one Magazine consumable (Weapon Resource) to grant 6 Volley charges
   * (Coatings-style AE). Specialty magazines replace piercing damage type.
   */
  magazines: spec(
    "bonus_action",
    {
      activation: "bonus",
      activityType: "utility",
      chatFlavor:
        "Expend one Magazine from inventory to fill weapon Charges (6 Volleys).",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/weapons/ammunition/bullets-cartridge-shell-gray.webp",
    },
    "ItemMacro dialog → spend Magazine consumable → fill weapon Charges (max 6).",
  ),
  "magazines upgrade i": spec(
    "upgrade_scaler",
    {},
    "Specialty Magazines pouch capacity 3 (narrative; see Magazines section).",
  ),
  "magazines upgrade ii": spec(
    "upgrade_scaler",
    {},
    "Specialty Magazines pouch capacity 5 (narrative).",
  ),
  "magazines upgrade iii": spec(
    "upgrade_scaler",
    {},
    "Specialty Magazines pouch capacity 7 (narrative).",
  ),
  "empowered reload": spec(
    "bonus_action",
    {
      activation: "bonus",
      activityType: "utility",
      chatFlavor:
        "Expend one Magazine to reload Charges (6). Empowered (+1d4) if a hostile is within 15 ft.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/magic/fire/projectile-fireball-smoke-orange.webp",
    },
    "Same Magazines dialog; applies Empowered AE when a hostile is within 15 ft.",
  ),
  recital: spec(
    "bonus_action",
    {
      activation: "bonus",
      activityType: "utility",
      activationCondition:
        "When you hit a creature with this weapon on your turn",
      chatFlavor: "Perform a Melody from your Songbook",
      durationValue: "1",
      durationUnits: "minute",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      otherActivityCompatible: false,
      effectConditionText: "false",
      activityImg: "icons/skills/trades/music-notes-sound-blue.webp",
    },
    "Opens Songbook via ItemMacro (Hunting Horn overlay); Melody feats toggle Active Auras.",
  ),
  encore: baUtility("", "Recital can keep two melodies active."),
  "item prodigy": baUtility("", "Take the Utilize action as a Bonus Action."),
  /**
   * Sword and Shield (Uncommon+): secondary Martial Melee attack (Light, 1d4 B).
   * Does not include the sword’s base damage; Ability mod via activity roll.
   */
  "shield bash": spec(
    "action_ability",
    {
      activation: "action",
      activityType: "attack",
      damageFormula: "1d4",
      damageType: "bludgeoning",
      includeBaseDamage: false,
      chatFlavor:
        "Martial Melee (Light): 1d4 Bludgeoning. Pair with Mastery (Nick) as part of the Attack action.",
      activityImg: "icons/equipment/shield/heater-steel-boss-red.webp",
    },
    "Secondary shield attack; exclude sword base damage (includeBase=false).",
  ),
  /**
   * Sword and Shield (Rare+): on hit, target has Disadvantage on its next save
   * vs an item or spell (until end of your next turn). Midi approximates with
   * save.all + isSave / turnEndSource — intended scope is narrative/GM filter.
   */
  "alchemical rend": spec(
    "on_hit_condition",
    {
      effectTransfer: false,
      effectChanges: [
        {
          key: "flags.midi-qol.disadvantage.ability.save.all",
          mode: EFFECT_MODE.CUSTOM,
          value: "1",
          priority: 20,
        },
      ],
      specialDuration: ["isSave", "turnEndSource"],
      activeEffect: {
        showIcon: true,
        stackable: "noneName",
        img: "icons/magic/acid/dissolve-bone-white.webp",
        description:
          "Disadvantage on the next saving throw against an item or a spell (until the end of the attacker's next turn).",
      },
    },
    "Link AE to Attack + Shield Bash; clear effectConditionText on those attacks so Midi can apply on hit.",
  ),
  "advancing slash": spec(
    "upgrade_scaler",
    {
      chatFlavor:
        "When you use Item Prodigy (Utilize as a Bonus Action), immediately move up to 10 ft without provoking Opportunity Attacks.",
    },
    "Rider on Item Prodigy — fold into Item Prodigy chatFlavor in Rare+ authored JSONs.",
  ),
  "blast dash": spec("bonus_action", {
    activation: "bonus",
    activityType: "utility",
    consumeItemUses: true,
    consumeAmount: "1",
    chatFlavor: "Expend 1 shell; propel yourself up to 20 ft (no OA).",
    rangeUnits: "self",
    targetAffectsType: "self",
    targetPrompt: false,
    activityImg: "icons/magic/fire/projectile-fireball-smoke-orange.webp",
  }),
  /**
   * RaintDM Light Bowgun: Bonus Action attack(s).
   * Amellwind LBG “Rapid Fire” is Extra Attack narrative — prefer per-weapon
   * `automation` override there if both catalogs share this registry key.
   */
  "rapid fire": spec("bonus_action", {
    activation: "bonus",
    activityType: "attack",
    includeBaseDamage: true,
    consumeItemUses: true,
    activationCondition:
      "When you take the Attack action and attack with this weapon",
    chatFlavor: "Make 1 additional attack with this weapon as a Bonus Action.",
  }),
  "rapid fire upgrade i": spec("upgrade_scaler", {
    chatFlavor: "Make 2 additional attacks with this weapon as a Bonus Action.",
  }),
  "rapid fire upgrade ii": spec("upgrade_scaler", {
    chatFlavor: "Make 3 additional attacks with this weapon as a Bonus Action.",
  }),
  "rapid fire upgrade iii": spec("upgrade_scaler", {
    chatFlavor: "Make 4 additional attacks with this weapon as a Bonus Action.",
  }),
  wyvernheart: spec("bonus_action", {
    activation: "bonus",
    activityType: "attack",
    includeBaseDamage: true,
    consumeItemUses: true,
    chatFlavor:
      "Spend 1 Ignition. One extra attack; +1d6 piercing if you already hit with this weapon this turn.",
    activityImg: "icons/weapons/ammunition/shot-round-red.webp",
  }),
  "wyvernheart upgrade i": spec("upgrade_scaler", {
    chatFlavor:
      "Spend 1 Ignition. One extra attack; +1d8 piercing if you already hit with this weapon this turn.",
  }),
  guard: reactionUtility(
    "When a creature you can see hits you with an attack while you are wielding this weapon",
    {
      rollFormula: "1d4",
      chatFlavor:
        "Add 1d4 to your AC against that attack. Cannot be used on a turn you used Wyvernheart.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/shield-block-gray-orange.webp",
    },
    "Heavy Bowgun shield: AC roll is exposed; Wyvernheart same-turn lockout is Item Macro.",
  ),
  wyverncounter: spec("reaction", {
    activation: "reaction",
    activityType: "attack",
    includeBaseDamage: true,
    consumeItemUses: true,
    activationCondition: "When you use Guard and the triggering attack misses you",
    chatFlavor:
      "Spend 1 Ignition. One attack (no special ammo). Extra 1d8 piercing if the creature is within 15 ft.",
    activityImg: "icons/skills/ranged/cannon-barreling-orange.webp",
  }, "Item Macro: requires Guard this turn; spends Ignition; extra 1d8 within 15 ft."),
  "guard upgrade i": spec("upgrade_scaler", {
    rollFormula: "1d6",
    chatFlavor:
      "Add 1d6 to your AC against that attack. Cannot be used on a turn you used Wyvernheart.",
  }),
  magazine: gauge(
    "6",
    undefined,
    "Loaded rounds (standard ammo). Attack / Rapid Fire / ammo activities consume 1.",
  ),
  "magazine upgrade i": scaleUses("8"),
  "magazine upgrade ii": scaleUses("10"),
  "magazine upgrade iii": scaleUses("12"),
  "magazine upgrade iv": scaleUses("15"),
  "evading reload": spec("bonus_action", {
    activation: "special",
    activityType: "utility",
    activationCondition:
      "Once per turn, if you move at least 15 feet in a straight line",
    chatFlavor:
      "Reload half magazine (standard or Special Ammo capacity, rounded down). Adjust item uses manually.",
    rangeUnits: "self",
    targetAffectsType: "self",
    targetPrompt: false,
  }),
  wyvernblast: spec("bonus_action", {
    activation: "bonus",
    activityType: "save",
    saveAbility: "dex",
    damageFormula: "1d6",
    damageType: "fire",
    onSave: "half",
    templateType: "radius",
    templateSize: "5",
    usesMax: "@prof",
    usesRecoveryPeriod: "lr",
    chatFlavor: "Plant or shoot a Wyvernblast charge (see feature for placement).",
  }),
  "wyvernblast upgrade i": spec("upgrade_scaler", {
    damageFormula: "1d8",
    damageType: "fire",
  }),
  "wyvernblast upgrade ii": spec("upgrade_scaler", {
    damageFormula: "1d10",
    damageType: "fire",
  }),
  "demon mode": spec("mode_aura_or_stance", {
    activation: "bonus",
    usesMax: "@prof",
    usesRecoveryPeriod: "lr",
    speedBonus: "10",
    durationSeconds: 60,
    durationValue: "1",
    durationUnits: "minute",
    toggleEffect: true,
    rangeUnits: "self",
    targetAffectsType: "self",
    targetPrompt: false,
    activityImg: "icons/magic/unholy/strike-body-life-soul-green.webp",
    chatFlavor:
      "+10 walk; +1d4 slashing on melee weapon attacks (Light extra attack bonus).",
    effectChanges: [
      {
        key: "system.bonuses.mwak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d4[slashing]",
        priority: 20,
      },
    ],
    activeEffect: {
      img: "icons/magic/unholy/strike-body-life-soul-green.webp",
      showIcon: true,
      // Do not set selfTarget: Midi toggleEffect already applies the AE.
      // selfTarget + toggleEffect doubles the effect on the actor.
      disableIncapacitated: true,
    },
  }),
  "demon mode upgrade": spec("upgrade_scaler", {
    speedBonus: "15",
    effectChanges: [
      {
        key: "system.bonuses.mwak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d6[slashing]",
        priority: 20,
      },
    ],
  }),
  "demon mode upgrade i": spec("upgrade_scaler", {
    speedBonus: "15",
    effectChanges: [
      {
        key: "system.bonuses.mwak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d6[slashing]",
        priority: 20,
      },
    ],
  }),
  /** Very Rare feature name on Dual Blades (upgrades Demon Mode). */
  "demon upgrade": spec("upgrade_scaler", {
    speedBonus: "15",
    effectChanges: [
      {
        key: "system.bonuses.mwak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d6[slashing]",
        priority: 20,
      },
    ],
  }),
  "archdemon mode": spec("mode_aura_or_stance", {
    activation: "bonus",
    activationCondition: "When Demon Mode ends",
    durationSeconds: 60,
    durationValue: "1",
    durationUnits: "minute",
    toggleEffect: true,
    rangeUnits: "self",
    targetAffectsType: "self",
    targetPrompt: false,
    activityImg: "icons/magic/unholy/strike-beam-blood-red-purple.webp",
    chatFlavor:
      "+1d4 slashing retained; no speed bonus / Demon Dodge. Ends Demon Mode if still active.",
    effectChanges: [
      {
        key: "system.bonuses.mwak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d4[slashing]",
        priority: 20,
      },
    ],
    activeEffect: {
      img: "icons/magic/unholy/strike-beam-blood-red-purple.webp",
      showIcon: true,
      disableIncapacitated: true,
    },
  }),
  reload: spec(
    "bonus_action",
    {
      activation: "bonus",
      activityType: "utility",
      chatFlavor:
        "Fully reload magazine (also usable as an Action). Set spent uses to 0 for standard ammo, or to max − Special Ammo capacity when loading Special Ammo.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
    },
    "Manual item-uses adjust after reload.",
  ),

  // ── Action / special abilities with fixed geometry ──────────────────
  "amped element discharge": counterSpend(
    {
      ownsItemUses: false,
      emitGather: false,
      spendMin: 1,
      spendMax: 5,
      damageFormula: "1d8",
      activityType: "save",
      saveAbility: "dex",
      onSave: "half",
      templateType: "cone",
      templateSize: "15",
      activation: "action",
      activationCondition: "While in Axe Mode",
      chatFlavor:
        "Expend phial counters for a cone of elemental energy (per phial die below).",
    },
    "Shared Phial Charges pool. Emits ×1…×5 save activities (or scale if max grows).",
  ),
  "amped element discharge (aed)": counterSpend(
    {
      ownsItemUses: false,
      emitGather: false,
      spendMin: 1,
      spendMax: 5,
      damageFormula: "1d8",
      activityType: "save",
      saveAbility: "dex",
      onSave: "half",
      templateType: "cone",
      templateSize: "15",
      activation: "action",
      activationCondition: "While in Axe Mode",
      chatFlavor: "AED cone; expend chosen number of remaining phials (min 1).",
    },
  ),
  "super amped element discharge": spec("upgrade_scaler", {
    templateSize: "30",
    damageFormula: "1d12",
    chatFlavor: "SAED: 30-ft cone; 1d12 per phial; Huge+ coverage rider per description.",
  }),
  dragonpiercer: saveAction({
    saveAbility: "dex",
    templateType: "line",
    templateSize: "30",
    templateWidth: "5",
    damageFormula: "4d6",
    damageType: "piercing",
    usesMax: "1",
    usesRecoveryPeriod: "lr",
    notes: "Amellwind marks 1/LR; Raint may differ — uses capped at 1/LR by default.",
  }),
  "true dragonpiercer": spec("upgrade_scaler", {
    damageFormula: "6d6",
    ignoreCover: true,
  }),
  earthshaker: saveAction({
    saveAbility: "con",
    templateType: "radius",
    templateSize: "20",
    chatFlavor: "Slam horn; hostile creatures in 20-ft radius.",
  }),
  "wyvern's fire": saveAction({
    saveAbility: "dex",
    templateType: "cone",
    templateSize: "15",
    damageFormula: "4d6",
    damageType: "fire",
    consumeItemUses: true,
    consumeAmount: "4",
    chatFlavor: "Expend 4 shells: Fire + Thunder blast (add thunder part manually if needed).",
  }),
  "wyvern's fire upgrade": spec("upgrade_scaler", {
    damageFormula: "5d6",
    chatFlavor: "5d6 Fire + 5d6 Thunder.",
  }),
  "arcane discharge": counterSpend(
    {
      ownsItemUses: false,
      emitGather: false,
      spendMin: 1,
      spendMax: 10,
      damageFormula: "1d6",
      activityType: "damage",
      activation: "special",
      chatFlavor:
        "When casting a damaging leveled Instantaneous spell: add this damage to one affected target per counter spent.",
    },
    "Shared Spell Core pool. Wide spend range → one scaled damage activity.",
  ),
  "discharge upgrade i": spec("upgrade_scaler", { damageFormula: "1d8" }),
  "discharge upgrade ii": spec("upgrade_scaler", {
    damageFormula: "1d10",
    chatFlavor: "1d10 per counter; spell ignores Resistance to its damage type.",
  }),
  "zero sum spell": counterSpend(
    {
      ownsItemUses: false,
      emitGather: false,
      spendMin: 3,
      spendMax: 10,
      damageFormula: "1d12",
      damageType: "force",
      activityType: "attack",
      includeBaseDamage: false,
      activation: "action",
      chatFlavor:
        "Melee spell attack; expend chosen counters (min 3). On hit: Force damage + push 15 ft. Clears remaining counters after resolution — spend all you intend via scaling.",
    },
    "Shared Spell Core pool. Scaled attack (min 3).",
  ),
  "zero sum discharge (zsd)": counterSpend(
    {
      ownsItemUses: false,
      emitGather: false,
      spendMin: 2,
      spendMax: 10,
      damageFormula: "1d10",
      activityType: "attack",
      includeBaseDamage: true,
      activation: "action",
      advantageOnUse: true,
      activationCondition: "Sword mode with at least 2 Phial Charges",
      chatFlavor:
        "ZSD thrust with advantage. Expend chosen phials (min 2); +1d10 phial damage each. Recoil / mode swap per description.",
    },
    "Shared Phial Gauge. Wide range → scaled attack with advantage AE.",
  ),
  "zero sum discharge splash": spec(
    "upgrade_scaler",
    {
      chatFlavor:
        "ZSD Splash (Rare+): even on a miss, creatures within 5 ft of the target DEX save or take half the Phial explosion damage (companion Save activity).",
    },
    "Leaf renames ZSD. Companion DEX save emitted by Switch Axe overlay.",
  ),
  "true zero sum discharge": spec(
    "upgrade_scaler",
    {
      chatFlavor:
        "On hit: also add STR modifier once per phial expended to the phial explosion damage.",
    },
    "STR-per-phial bonus is manual / description until a formula AE exists.",
  ),
  "burst slash": saveAction({
    saveAbility: "dex",
    consumeItemUses: true,
    chatFlavor: "Expend Accelerator charges vs creature within 5 ft.",
  }),
  "perfect rush": spec("action_ability", {
    activation: "special",
    activityType: "damage",
    damageFormula: "3d6",
    chatFlavor: "Once per turn after Sword + Shield Bash hit the same creature.",
  }),
  "true perfect rush": spec("upgrade_scaler", {
    damageFormula: "5d6",
    statuses: ["prone"],
    chatFlavor: "5d6 extra; STR save or Prone per description.",
  }),

  // ── On-hit optional riders (manual activity — not midi-auto chained) ─
  "shelling strike": counterSpend(
    {
      ownsItemUses: false,
      emitGather: false,
      spendMin: 1,
      spendMax: 1,
      damageFormula: "1d6",
      damageType: "thunder",
      activityType: "damage",
      activation: "special",
      activationCondition:
        "When you hit a creature with a melee attack using this weapon",
      chatFlavor: "On melee hit: expend shells for extra Thunder damage.",
      activityImg: "icons/magic/fire/explosion-fireball-medium-orange.webp",
    },
    "Shared Artillery Shells pool. Full Burst upgrades spendMax/die. Hand-tuned uncommon: on-hit ItemMacro dialog → completeActivityUse ×1.",
  ),
  "full burst": spec(
    "upgrade_scaler",
    {
      spendMax: 3,
      damageFormula: "1d8",
      chatFlavor: "Spend up to 3 shells; 1d8 Thunder each.",
    },
    "Hand-tuned rare renames ×N to Shelling Strike + ItemMacro ×1/×2/×3 dialog (fvtt-Item-gunlance-rare).",
  ),
  "elemental attunement": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "utility",
      usesMax: "1",
      usesRecoveryPeriod: "sr",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      chatFlavor:
        "Once per Short or Long Rest: choose the element attuned to this weapon (Acid, Cold, Fire, or Lightning). Guard Point Eruption, Elemental Discharge, and AED use that type.",
      activityImg: "icons/magic/symbols/elements-air-earth-fire-water.webp",
    },
    "Charge Blade: ItemMacro dialog sets flags.world.chargeBlade.elementalType and updates elemental activity damage types. No default element.",
  ),
  "elemental discharge": spec("action_ability", {
    activation: "special",
    activityType: "damage",
    damageFormula: "1d6",
    consumeItemUses: true,
    consumeAmount: "1",
    activationCondition: "When you hit a creature with an attack in Axe Mode",
    chatFlavor:
      "Axe mode on hit: expend 1 phial for attuned elemental damage (prompted by ItemMacro).",
    activityImg: "icons/magic/lightning/bolt-strike-smoke-yellow.webp",
  }),
  /**
   * Switch Axe: Sword-mode hits must spend 1 Phial Charge to activate the installed
   * Phial. Default formula is Power (1d6 S); Element (1d8) is emitted as a sibling
   * activity by `applySwitchAxeOverlay` when that Phial is unlocked.
   */
  "phial discharge": spec("action_ability", {
    activation: "special",
    activityType: "damage",
    damageFormula: "1d6",
    damageType: "slashing",
    consumeItemUses: true,
    consumeAmount: "1",
    activationCondition: "Sword mode on hit",
    chatFlavor:
      "Expend 1 Phial Charge to activate your installed Phial (Power 1d6 Slashing / Element 1d8 Acid, Cold, Fire, or Lightning).",
  }),
  "elemental discharge upgrade i": spec("upgrade_scaler", {
    damageFormula: "1d8",
  }),
  "elemental discharge upgrade ii": spec("upgrade_scaler", {
    damageFormula: "1d10",
  }),
  "mighty weapon": saveAction({
    activation: "special",
    saveAbility: "con",
    statuses: ["stunned"],
    onSave: "none",
    usesMax: "1",
    usesRecoveryPeriod: "sr",
    chatFlavor: "On hit vs Large or smaller: CON save or Stunned until end of your next turn.",
  }),
  "mighty weapon upgrade i": spec("upgrade_scaler", { usesMax: "2" }),
  "mighty weapon upgrade ii": spec("upgrade_scaler", { usesMax: "3" }),
  "mighty weapon upgrade iii": spec("upgrade_scaler", { usesMax: "4" }),
  "charge (h)": spec("action_ability", {
    activation: "special",
    activityType: "damage",
    damageFormula: "1d4",
    damageType: "bludgeoning",
    chatFlavor: "After 20-ft straight move without taking damage: extra 1d4 on first hammer attack.",
  }),
  "charge (l)": spec("action_ability", {
    activation: "special",
    activityType: "damage",
    damageFormula: "1d4",
    damageType: "piercing",
    chatFlavor: "After 20-ft straight move without taking damage: extra 1d4 on first lance attack.",
  }),
  "charge upgrade i (h)": spec("upgrade_scaler", { damageFormula: "2d4" }),
  "charge upgrade ii (h)": spec("upgrade_scaler", { damageFormula: "3d4" }),
  "charge upgrade iii (h)": spec("upgrade_scaler", { damageFormula: "4d4" }),
  "charge upgrade i (l)": spec("upgrade_scaler", { damageFormula: "2d4" }),
  "charge upgrade ii (l)": spec("upgrade_scaler", { damageFormula: "3d4" }),
  "big bang combo": spec("action_ability", {
    activation: "special",
    activityType: "damage",
    damageFormula: "2d6",
    damageType: "bludgeoning",
    chatFlavor: "Extra damage vs Prone or Stunned targets.",
  }),
  // ── Wire Knuckles (Wirebug pool + mobility) ─────────────────────────
  "wire-dash": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "utility",
      consumeItemUses: true,
      consumeAmount: "1",
      activationCondition: "When you take damage",
      chatFlavor:
        "Expend 1 Wirebug: move up to 15 ft in any direction (including vertically). This movement does not provoke Opportunity Attacks.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/movement/figure-running-gray.webp",
    },
    "Does not consume Reaction — trigger is optional spend when damaged.",
  ),
  "wire-fall": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "utility",
      consumeItemUses: true,
      consumeAmount: "1",
      activationCondition: "When you fall",
      chatFlavor:
        "Expend 1 Wirebug: arrest your fall in mid-air until the start of your next turn; take no fall damage from the previous drop.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/magic/air/wind-stream-blue-gray.webp",
    },
    "Does not consume Reaction — trigger is optional spend when falling.",
  ),
  "silkbind tether": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "utility",
      consumeItemUses: true,
      consumeAmount: "1",
      activationCondition: "When you hit a creature with this weapon",
      chatFlavor:
        "Expend 1 Wirebug: apply Tethered (cannot move more than 15 ft from the embed point). Start-of-turn STR save uses Snap Silkbind.",
      targetAffectsType: "creature",
      targetPrompt: true,
      rangeUnits: "ft",
      rangeValue: "5",
      effectTransfer: false,
      activityImg: "icons/magic/control/debuff-chains-blue.webp",
      activeEffect: {
        name: "Tethered",
        img: "icons/magic/control/debuff-chains-blue.webp",
        showIcon: true,
        stackable: "noneName",
        description:
          "Tethered by ironsilk. Cannot move more than 15 feet away from the point where the silk was embedded. At the start of each of your turns, you may attempt a Strength saving throw against the silkbinder's Silkbind DC (use Snap Silkbind on their weapon) to snap the silk and end this effect.",
      },
    },
    "Apply AE manually via Midi on use. 15-ft leash is theater-of-the-mind / measured from embed token mark.",
  ),
  "silkbind grapple": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "utility",
      activationCondition: "While a creature is Tethered by your Silkbind",
      chatFlavor:
        "While a creature is Tethered by your Silkbind, you may attempt to Grapple it even if it is up to two size categories larger than you.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/unarmed-punch-fist-yellow-red.webp",
    },
    "Narrative size override for Grapple — no mechanical consume.",
  ),

  // ── Charged Slash family (self-owned counter + Gather + ×N attacks) ─
  "charged slash": counterSpend(
    {
      itemUsesMax: "3",
      poolStartsEmpty: true,
      emitGather: true,
      gatherLabel: "Gather Charge",
      gatherChatFlavor:
        "Forgo one attack with this weapon (Attack action or opportunity attack): recover 1 item use (grant 1 charge, max 3). Charges are lost if not used within 1 minute.",
      spendMin: 1,
      spendMax: 3,
      damageFormula: "3d6",
      damageType: "slashing",
      includeBaseDamage: true,
      activation: "special",
      activityType: "attack",
      advantageOnUse: true,
      chatFlavor:
        "Attack with advantage. Extra damage is Nd6 per charge expended (pick the ×N matching your charges).",
    },
    "Owns item uses (start empty). Gather recovers 1; ×N attacks consume N.",
  ),
  "true charged slash": spec(
    "upgrade_scaler",
    {
      damageFormula: "4d6",
      chatFlavor:
        "Attack with advantage. Extra 4d6 per charge. Large or smaller: STR save (DC 8 + PB + STR) or Prone.",
    },
    "4d6 per charge + STR save or Prone on hit (save is manual / description).",
  ),
  "divine true charged slash": spec(
    "upgrade_scaler",
    {
      damageFormula: "6d6",
      statuses: ["stunned"],
      chatFlavor:
        "Attack with advantage. Extra 6d6 per charge. On hit: target Stunned until start of your next turn.",
    },
    "6d6 per charge + Stunned on hit (status noted in chat; apply manually if needed).",
  ),
  // Exact name used on RaintDM Great Sword (not "Charge Upgrade I (H)").
  "charge upgrade": spec(
    "upgrade_scaler",
    { damageFormula: "5d6" },
    "RaintDM GS: charged slash extra damage → 5d6 per charge.",
  ),
  // Intentionally NOT registering bare "charge" — collides with Charge (H)/(L).

  // ── Counter builders (document recovering shared pools) ─────────────
  "harvest magic": spec("action_ability", {
    activation: "special",
    activityType: "utility",
    chatFlavor:
      "On cantrip damage to a hostile: recover 1 Spell Counter on this staff (2 if target within 15 ft).",
  }),
  "kinetic generator": spec(
    "unmapped",
    {},
    "Switch Axe: ItemMacro postDamageRoll recovers Phial Gauge uses on Axe hit (see applySwitchAxeOverlay).",
  ),

  // ── Longsword spirit techniques ─────────────────────────────────────
  "spirit blade": counterSpend(
    {
      ownsItemUses: false,
      emitGather: false,
      spendMin: 1,
      spendMax: 6,
      damageFormula: "1d4",
      damageType: "slashing",
      activityType: "damage",
      includeBaseDamage: false,
      activation: "special",
      activationCondition:
        "When you hit with a normal attack using this weapon",
      chatFlavor:
        "On a normal hit: expend N spirit for +Nd4 slashing. Do not use on a Spirit replace attack.",
    },
    "Shared Spirit Gauge. Wide range → scaled damage rider (not a second attack roll).",
  ),
  "spirit blade upgrade i": spec(
    "upgrade_scaler",
    {
      damageFormula: "1d6",
      chatFlavor:
        "On a normal hit: expend N spirit for +Nd6 slashing. Do not use on a Spirit replace attack.",
    },
    "Spirit Blade extra damage → 1d6 per spirit.",
  ),
  "foresight slash": reactionUtility(
    "When a creature you can see hits you with a melee attack",
    {
      rollFormula: "1d8",
      chatFlavor:
        "Expend 2 spirit. Add 1d8 to your AC against that attack. If this causes a miss: one Longsword attack vs the attacker and regain 1 spirit.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/strike-sword-steel-yellow.webp",
    },
    "Do not consume itemUses on the reaction (Midi unpaid-reaction filter). Overlay ItemMacro spends 2 spirit, applies +1d8 AC (isAttacked), refunds 1 on miss, and emits Foresight Slash: Counter.",
  ),
  "spirit thrust": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "attack",
      includeBaseDamage: true,
      consumeItemUses: true,
      consumeAmount: "2",
      chatFlavor:
        "Replace one Attack-action attack. Expend 2 spirit: piercing damage. On hit, move 15 ft through the target without OA.",
      activityImg: "icons/skills/melee/strike-sword-blood-red.webp",
    },
    "Consumes 2 Spirit Gauge uses. Damage type swap (S→P) is description / manual.",
  ),
  "spirit roundslash": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "attack",
      includeBaseDamage: true,
      consumeItemUses: true,
      consumeAmount: "3",
      chatFlavor:
        "Replace one Attack-action attack (once per turn). Expend 3 spirit. Optional second creature within 5 ft of the target takes weapon damage without your ability modifier.",
      activityImg: "icons/skills/melee/strike-blade-hooked-orange.webp",
    },
    "Cleave rider vs a second target is manual.",
  ),
  "spirit helm breaker": spec(
    "action_ability",
    {
      activation: "special",
      activityType: "attack",
      includeBaseDamage: true,
      consumeItemUses: true,
      consumeAmount: "3",
      damageFormula: "3d6",
      damageType: "slashing",
      chatFlavor:
        "Replace one Attack-action attack (once per turn). Expend 3 spirit: move 10 ft toward the target without OA, then attack with +3d6 (+4d6 if another Spirit technique already resolved this Attack action).",
      activityImg: "icons/skills/melee/strike-axe-blood-red.webp",
    },
    "Combo +1d6 is honor-system. No Prone/Stun.",
  ),
  "spirit release slash": spec(
    "upgrade_scaler",
    {
      damageFormula: "5d6",
      chatFlavor:
        "Helm Breaker extra is 5d6 if you had 5+ spirit before the spend (6d6 if the combo bonus also applies).",
    },
    "Crimson threshold (5+ spirit before spend) is description; Foundry uses the 5d6 scaler.",
  ),
  "special sheathe (iai spirit slash)": spec(
    "bonus_action",
    {
      activation: "bonus",
      activityType: "utility",
      activationCondition: "Enter Iai until the start of your next turn",
      chatFlavor:
        "Sheathe: Speed −10 ft until start of next turn. If a creature hits you or enters your reach while in Iai, Reaction: expend 3 spirit, attack with Advantage +3d6. If you had 5+ spirit before the spend, target has Disadvantage on its next save before the start of your next turn.",
      rangeUnits: "self",
      targetAffectsType: "self",
      targetPrompt: false,
      activityImg: "icons/skills/melee/sword-engraved-glow-purple.webp",
    },
    "Iai Reaction / Advantage / 3-spirit spend is honor-system; activity is the BA sheathe.",
  ),

  // ── Narrative / state — keep description-only ───────────────────────
  "dull the blade": spec("unmapped", {}, "Removes Graze until rest/sharpen — not automatible as AE cleanly."),
};

/**
 * Parse "Mastery Property (Graze)", "Mastery (Sap)", "Mastery: Push",
 * "Mastery (Cleave) (Axe Mode)" → mastery template.
 */
export function parseWeaponMasteryAutomation(
  featureName: string,
): WeaponFeatureAutomationSpec | undefined {
  const raw = featureName.trim();
  if (!raw || /^dual\s+mastery$/i.test(raw) || /songbook\s+mastery/i.test(raw)) {
    return undefined;
  }

  const match =
    raw.match(/^mastery\s+property\s*\(([^)]+)\)/i) ??
    raw.match(/^mastery\s*\(([^)]+)\)/i) ??
    raw.match(/^mastery\s*:\s*([a-z]+)/i);
  if (!match) return undefined;

  const id = match[1]
    .toLowerCase()
    .replace(/[^a-z].*$/, "")
    .trim();
  if (!WEAPON_MASTERY_IDS.has(id)) return undefined;

  const modeHint = raw.match(/\)\s*\(([^)]+)\)\s*$/);
  return spec(
    "mastery",
    { mastery: id },
    modeHint
      ? `Applies system.mastery=${id} (${modeHint[1].trim()}). Switch weapons may need per-mode adjustment in Foundry.`
      : `Sets system.mastery to "${id}".`,
  );
}

function parseSwitchModeAutomation(
  normalized: string,
): WeaponFeatureAutomationSpec | undefined {
  if (/^switch mode(\s*\([^)]*\))?$/.test(normalized)) {
    return spec("mode_switch", { activation: "bonus" });
  }
  return undefined;
}

function cloneSpec(
  entry: WeaponFeatureAutomationSpec,
): WeaponFeatureAutomationSpec {
  return { ...entry, params: { ...entry.params } };
}

export function lookupWeaponFeatureAutomation(
  featureName: string,
): WeaponFeatureAutomationSpec | undefined {
  const key = normalizeFeatureAutomationName(featureName);
  if (!key) return undefined;

  const direct = WEAPON_FEATURE_AUTOMATION_REGISTRY[key];
  if (direct) return cloneSpec(direct);

  const mastery = parseWeaponMasteryAutomation(featureName);
  if (mastery) return cloneSpec(mastery);

  const masteryNorm = parseWeaponMasteryAutomation(key);
  if (masteryNorm) return cloneSpec(masteryNorm);

  const mode = parseSwitchModeAutomation(key);
  if (mode) return cloneSpec(mode);

  // Exact upgrade keys miss → root without "Upgrade…".
  const withoutUpgrade = stripFeatureAutomationUpgradeSuffix(key);
  if (withoutUpgrade && withoutUpgrade !== key) {
    const root = WEAPON_FEATURE_AUTOMATION_REGISTRY[withoutUpgrade];
    if (root) return cloneSpec(root);
    const masteryRoot = parseWeaponMasteryAutomation(withoutUpgrade);
    if (masteryRoot) return cloneSpec(masteryRoot);
  }

  // Renames that prepend True / Amped / Super.
  const stripped = key.replace(/^(true|super|amped)\s+/i, "").trim();
  if (stripped && stripped !== key) {
    const fallback = WEAPON_FEATURE_AUTOMATION_REGISTRY[stripped];
    if (fallback) return cloneSpec(fallback);
    const masteryStripped = parseWeaponMasteryAutomation(stripped);
    if (masteryStripped) return cloneSpec(masteryStripped);
  }
  return undefined;
}
