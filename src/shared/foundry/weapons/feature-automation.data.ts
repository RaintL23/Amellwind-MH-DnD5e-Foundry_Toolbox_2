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
    "sr",
    "Spirit spent via description options — uses track the pool only.",
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
      chatFlavor: "Reload all expended shells.",
    },
    "Shell capacity as item uses (starts full). BA reloads the pool.",
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
    { chatFlavor: "Add your Proficiency Bonus to AC against the triggering attack." },
  ),
  "perfect evade": reactionUtility(
    "After Demon Dodge causes the triggering attack to miss",
    {
      activityType: "attack",
      includeBaseDamage: true,
      chatFlavor: "Make one melee weapon attack as part of the same reaction.",
    },
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
      consumeItemUses: true,
      consumeAmount: "1",
      chatFlavor: "Expend 1 phial: +2 AC vs the attack; deal Guard Point damage on a miss/block per description.",
    },
  ),
  "guard point upgrade i": spec("upgrade_scaler", {
    damageFormula: "1d6",
    chatFlavor: "Guard Point damage 1d6.",
  }),
  "guard point upgrade ii": spec("upgrade_scaler", {
    damageFormula: "1d8",
    chatFlavor: "Guard Point damage 1d8.",
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
    "When a creature misses you with a melee attack while wielding the shield",
    { chatFlavor: "Reload up to 2 expended shells." },
  ),
  "counter mine": reactionUtility(
    "When a creature hits you with a melee attack",
    {
      activityType: "damage",
      damageFormula: "1d6",
      damageType: "fire",
      chatFlavor: "Embed and detonate Wyvernblast on the attacker (see feature text for die).",
    },
  ),

  // ── Bonus actions ───────────────────────────────────────────────────
  "focus strike": baUtility(
    "",
    "Recover 1 counter on the Charged Slash pool without forgoing an Attack action attack.",
  ),
  "power charge": baUtility("", "Weapon remains charged for 1 minute or until you hit."),
  "guard dash": baUtility("", "Move up to 15 ft without provoking opportunity attacks."),
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
  "empowered reload": baUtility("", "Reload; Empowered if a hostile is within 15 ft."),
  magazines: baUtility("", "Reload both repeaters (6 volleys)."),
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
  "blast dash": spec("bonus_action", {
    activation: "bonus",
    activityType: "utility",
    consumeItemUses: true,
    consumeAmount: "1",
    chatFlavor: "Expend 1 shell; propel yourself up to 20 ft (no OA).",
  }),
  // "Rapid Fire" omitted: Amellwind = Extra Attack on Attack action; RaintDM = BA attack.
  wyvernblast: spec("bonus_action", {
    activation: "bonus",
    activityType: "save",
    saveAbility: "dex",
    damageFormula: "1d6",
    damageType: "fire",
    onSave: "half",
    templateType: "radius",
    templateSize: "5",
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
    usesMax: "2",
    usesRecoveryPeriod: "lr",
    speedBonus: "5",
    durationSeconds: 30,
    toggleEffect: true,
    chatFlavor: "+5 walk; +1d4 weapon damage on first hit each turn (manual).",
  }),
  "demon mode upgrade": spec("upgrade_scaler", {
    usesMax: "3",
    speedBonus: "10",
    damageFormula: "1d4",
  }),
  "demon mode upgrade i": spec("upgrade_scaler", {
    speedBonus: "15",
    damageFormula: "1d6",
  }),
  "archdemon mode": baUtility(
    "When Demon Mode ends",
    "Enter Archdemon Mode per description; uses tracked on Demon Mode.",
  ),
  reload: baUtility("", "Fully reload magazine (also usable as an Action)."),

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
      chatFlavor: "On melee hit: expend shells for extra Thunder damage.",
    },
    "Shared Artillery Shells pool. Full Burst upgrades spendMax/die.",
  ),
  "full burst": spec("upgrade_scaler", {
    spendMax: 3,
    damageFormula: "1d8",
    chatFlavor: "Spend up to 3 shells; 1d8 Thunder each.",
  }),
  "elemental discharge": spec("action_ability", {
    activation: "special",
    activityType: "damage",
    damageFormula: "1d6",
    consumeItemUses: true,
    consumeAmount: "1",
    chatFlavor: "Axe mode on hit: expend 1 phial for elemental damage.",
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
  "silkbind tether": spec("action_ability", {
    activation: "special",
    activityType: "utility",
    consumeItemUses: true,
    consumeAmount: "1",
    chatFlavor: "On hit: expend 1 Wirebug to tether the target.",
  }),

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
  "kinetic generator": spec("action_ability", {
    activation: "special",
    activityType: "utility",
    chatFlavor:
      "On Axe-mode hit: recover 1 Phial Charge (2 on a Critical Hit).",
  }),

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
