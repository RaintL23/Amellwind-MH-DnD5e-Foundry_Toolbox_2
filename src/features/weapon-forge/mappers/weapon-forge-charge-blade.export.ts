import type { FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  defaultMidiProperties,
  EFFECT_MODE,
  FOUNDRY_EXPORT_TARGET,
  foundryIdFromSeed,
} from "@/shared/foundry";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";
import {
  resolveGripModeDamage,
  resolveWeaponModeDefs,
} from "@/features/weapons/utils/weapon-mode.utils";
import { damageFieldFromFormula } from "./weapon-forge-foundry.helpers";
import { CHARGE_BLADE_ITEM_MACRO } from "./charge-blade.macro";

function activitiesOf(
  item: FoundryItem,
): Record<string, Record<string, unknown>> | undefined {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return undefined;
  return activities as Record<string, Record<string, unknown>>;
}

function isChargeBlade(item: FoundryItem, weapon: CustomWeapon): boolean {
  return (
    /^charge\s*blade/i.test(weapon.name) ||
    /^charge\s*blade/i.test(item.name ?? "")
  );
}

function hasFeature(
  weapon: CustomWeapon,
  rarityIndex: number,
  nameRe: RegExp,
): boolean {
  const end = Math.min(rarityIndex, weapon.rarityRows.length - 1);
  for (let i = 0; i <= end; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
      if (nameRe.test(ref.name.trim())) return true;
    }
  }
  return false;
}

/** Resolve Guard Point eruption die from the unlocked upgrade leaf. */
function resolveGuardPointDamage(weapon: CustomWeapon, rarityIndex: number): string {
  if (hasFeature(weapon, rarityIndex, /^guard\s*point\s*upgrade\s*ii$/i)) {
    return "1d8";
  }
  if (hasFeature(weapon, rarityIndex, /^guard\s*point\s*upgrade\s*i$/i)) {
    return "1d6";
  }
  return "1d4";
}

function resolveElementalDischargeDamage(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  if (
    hasFeature(weapon, rarityIndex, /^elemental\s*discharge\s*upgrade\s*ii$/i)
  ) {
    return "1d10";
  }
  if (
    hasFeature(weapon, rarityIndex, /^elemental\s*discharge\s*upgrade\s*i$/i)
  ) {
    return "1d8";
  }
  return "1d6";
}

function resolveAedDamage(weapon: CustomWeapon, rarityIndex: number): string {
  if (hasFeature(weapon, rarityIndex, /^super\s*amped/i)) {
    return "1d12";
  }
  if (
    hasFeature(
      weapon,
      rarityIndex,
      /^amped\s*element\s*discharge\s*upgrade\s*i$/i,
    )
  ) {
    return "1d10";
  }
  return "1d8";
}

const ELEMENTAL_TYPES = new Set(["acid", "cold", "fire", "lightning"]);

/**
 * Optional preset from "Elemental Attunement (Fire)" name.
 * Empty string = player must pick via the Elemental Attunement activity.
 */
function resolveElementalType(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const end = Math.min(rarityIndex, weapon.rarityRows.length - 1);
  for (let i = 0; i <= end; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
      const match = ref.name
        .trim()
        .match(/^elemental\s*attunement\s*\(([^)]+)\)/i);
      if (!match) continue;
      const t = match[1].trim().toLowerCase();
      if (ELEMENTAL_TYPES.has(t)) return t;
    }
  }
  return "";
}

function elementalLabel(elementalType: string): string {
  return elementalType.trim() || "attuned element";
}

function axeModeUseCondition(): string {
  return 'foundry.utils.getProperty(actor, "flags.world.cb.mode") === "axe"';
}

/**
 * Mode-gated masteries from feature names like
 * "Mastery (Sap) (Sword & Shield)" / "Mastery (Cleave) (Axe)".
 */
function resolveModeMasteries(
  weapon: CustomWeapon,
  rarityIndex: number,
): { sword: string; axe: string } {
  let sword = "";
  let axe = "";
  const end = Math.min(rarityIndex, weapon.rarityRows.length - 1);
  for (let i = 0; i <= end; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
      const raw = ref.name.trim();
      const match =
        raw.match(/^mastery\s+property\s*\(([^)]+)\)/i) ??
        raw.match(/^mastery\s*\(([^)]+)\)/i);
      if (!match) continue;
      const id = match[1]
        .toLowerCase()
        .replace(/[^a-z].*$/, "")
        .trim();
      if (!id) continue;
      const modeHint = raw.match(/\)\s*\(([^)]+)\)\s*$/)?.[1]?.toLowerCase() ?? "";
      if (/axe/.test(modeHint)) {
        axe = id;
      } else if (/sword|shield/.test(modeHint)) {
        sword = id;
      }
    }
  }
  return {
    sword: sword || "sap",
    axe: axe || "cleave",
  };
}

function isSwordShieldAttack(activity: Record<string, unknown>): boolean {
  const name = String(activity.name ?? "").trim();
  const midiId = String(
    (activity.midiProperties as { identifier?: string } | undefined)
      ?.identifier ?? "",
  );
  if (/^sword\s*&\s*shield$/i.test(name)) return true;
  if (/sword/i.test(midiId) && /shield/i.test(midiId)) return true;
  return false;
}

function isAxeAttack(activity: Record<string, unknown>): boolean {
  const name = String(activity.name ?? "").trim();
  const midiId = String(
    (activity.midiProperties as { identifier?: string } | undefined)
      ?.identifier ?? "",
  );
  return /^axe$/i.test(name) || /^axe$/i.test(midiId);
}

/**
 * Secondary mode (and primary for reliability) need `@mod` on damage parts when
 * includeBase is false — same pattern as Switch Axe Phial Discharge.
 */
function patchModeAttackModifiers(
  item: FoundryItem,
  weapon: CustomWeapon,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  const defs = resolveWeaponModeDefs(weapon);
  if (!defs || defs.length < 2) return;

  for (const activity of Object.values(activities)) {
    if (!activity || activity.type !== "attack") continue;

    let modeIdx = -1;
    if (isSwordShieldAttack(activity)) modeIdx = 0;
    else if (isAxeAttack(activity)) modeIdx = 1;
    else continue;

    const def = defs[modeIdx];
    if (!def) continue;
    const formula =
      resolveGripModeDamage(weapon, {
        label: def.label,
        damage: def.damage?.trim() || weapon.dmg1,
        dmgType: def.dmgType?.trim() || weapon.dmgType,
        hasShield: def.hasShield === true,
        isTwoHanded: def.isTwoHanded === true,
        blocksOffHand: def.blocksOffHand === true,
      }) || weapon.dmg1;
    const part = damageFieldFromFormula(
      formula,
      def.dmgType?.trim() || weapon.dmgType,
    );
    part.bonus = "@mod";
    activity.damage = {
      critical: { bonus: "" },
      includeBase: false,
      parts: [part],
    };
  }
}

function ensureModeIndicatorEffects(item: FoundryItem): {
  swordId: string;
  axeId: string;
} {
  const swordId = foundryIdFromSeed("eff-charge-blade-mode-sword");
  const axeId = foundryIdFromSeed("eff-charge-blade-mode-axe");

  const buildMode = (opts: {
    id: string;
    name: string;
    modeKey: "sword" | "axe";
    disabled: boolean;
    img: string;
  }) => {
    const effect = buildEffect({
      name: opts.name,
      img: opts.img,
      transfer: true,
      disabled: opts.disabled,
      changes: [
        {
          key: "flags.world.cb.mode",
          mode: EFFECT_MODE.OVERRIDE,
          value: opts.modeKey,
          priority: 20,
        },
      ],
      flags: {
        dae: {
          enableCondition: "",
          selfTarget: false,
          selfTargetAlways: false,
          stackable: "noneName",
          showIcon: true,
          durationExpression: "",
          specialDuration: [],
          disableIncapacitated: false,
          dontApply: false,
        },
        world: {
          cb: {
            isModeIndicator: true,
            modeKey: opts.modeKey,
          },
        },
      },
    });
    effect._id = opts.id;
    return effect;
  };

  item.effects = item.effects.filter((e) => {
    const world = (
      e.flags as { world?: { cb?: { isModeIndicator?: boolean } } }
    )?.world;
    if (world?.cb?.isModeIndicator) return false;
    if (/^(axe|sword(\s*&\s*shield)?)\s*mode$/i.test(e.name ?? "")) return false;
    return true;
  });

  // Default stance: Sword & Shield (generates Phial Charges / Guard Point).
  item.effects.push(
    buildMode({
      id: swordId,
      name: "Sword & Shield Mode",
      modeKey: "sword",
      disabled: false,
      img: "icons/weapons/swords/sword-guard-steel-green.webp",
    }),
    buildMode({
      id: axeId,
      name: "Axe Mode",
      modeKey: "axe",
      disabled: true,
      img: "icons/weapons/axes/axe-battle-black.webp",
    }),
  );

  return { swordId, axeId };
}

function patchModeAttackGates(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const activity of Object.values(activities)) {
    if (!activity || activity.type !== "attack") continue;
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};

    if (isSwordShieldAttack(activity)) {
      activity.useConditionText =
        'foundry.utils.getProperty(actor, "flags.world.cb.mode") !== "axe"';
      activity.useConditionReason =
        "Requires Sword & Shield Mode (use Switch Mode).";
      activity.midiProperties = {
        ...midi,
        identifier: "sword-shield",
        displayActivityName: true,
      };
      continue;
    }

    if (isAxeAttack(activity)) {
      activity.useConditionText =
        'foundry.utils.getProperty(actor, "flags.world.cb.mode") === "axe"';
      activity.useConditionReason =
        "Requires Axe Mode (use Switch Mode).";
      activity.midiProperties = {
        ...midi,
        identifier: "axe",
        displayActivityName: true,
      };
    }
  }
}

function patchSwitchMode(
  item: FoundryItem,
  modeEffectIds: { swordId: string; axeId: string },
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    if (!/^switch\s*mode$/i.test(String(activity.name ?? "").trim())) continue;

    activity.activation = {
      type: "bonus",
      value: 1,
      condition: "",
      override: false,
    };
    activity.description = {
      chatFlavor:
        "Toggle Sword & Shield Mode ↔ Axe Mode. Item Macro updates mode indicators, mastery (Sap/Cleave), and Integrated Shield AC.",
    };
    activity.effects = [
      { _id: modeEffectIds.swordId },
      { _id: modeEffectIds.axeId },
    ];
    activity.target = {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "self",
        choice: false,
        special: "",
      },
      prompt: false,
      override: false,
    };
    activity.range = { units: "self", special: "", override: false };
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "switch-mode",
        displayActivityName: true,
      }),
      ...midi,
      identifier: "switch-mode",
      displayActivityName: true,
      toggleEffect: false,
    };
  }
}

function patchGuardPoint(
  item: FoundryItem,
  opts: { damageFormula: string; magical: boolean; elementalType: string },
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  let guardActivity: Record<string, unknown> | undefined;

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const name = String(activity.name ?? "").trim();
    if (!/^guard\s*point(\s*\(elemental\s*guard\))?$/i.test(name)) continue;
    if (/eruption/i.test(name)) continue;

    // Mirror Lance Counter-Thrust / Shield: empty useCondition (Midi defaults to
    // isHit) and NO itemUses consumption on the activity. Phial spend happens in
    // ItemMacro so Midi still offers the reaction dialog.
    activity.name = "Guard Point";
    activity.type = "utility";
    activity.activation = {
      type: "reaction",
      value: 1,
      condition:
        "When you are hit by a melee attack while in Sword & Shield Mode",
      override: false,
    };
    activity.consumption = {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    };
    activity.description = {
      chatFlavor: `+2 AC vs the triggering attack (Midi rechecks, Shield pattern). Expends 1 Phial Charge via Item Macro. On a miss, use Guard Point: Eruption (${opts.damageFormula} ${elementalLabel(opts.elementalType)}).`,
    };
    activity.range = {
      value: null,
      units: "self",
      special: "",
      override: false,
    };
    activity.target = {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "self",
        choice: false,
        special: "",
      },
      prompt: false,
      override: false,
    };
    activity.uses = { spent: 0, max: "", recovery: [] };
    activity.roll = {
      formula: "",
      name: "",
      prompt: false,
      visible: false,
    };
    activity.useConditionText = "";
    activity.useConditionReason = "";
    activity.effectConditionText = "";
    activity.img = "icons/skills/melee/shield-block-gray-orange.webp";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "guard-point",
        displayActivityName: true,
      }),
      ...midi,
      identifier: "guard-point",
      displayActivityName: true,
    };
    guardActivity = activity;
  }

  if (!guardActivity) return;
  emitGuardPointEruption(item, guardActivity, opts);
}

function emitGuardPointEruption(
  item: FoundryItem,
  guardActivity: Record<string, unknown>,
  opts: { damageFormula: string; magical: boolean; elementalType: string },
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const eruptionId = foundryIdFromSeed("act-charge-blade-guard-eruption");
  // Drop prior eruption so re-export stays clean.
  for (const [id, activity] of Object.entries(activities)) {
    if (/^guard\s*point:\s*eruption$/i.test(String(activity?.name ?? ""))) {
      delete activities[id];
    }
  }

  const part = damageFieldFromFormula(
    opts.damageFormula,
    opts.elementalType,
  );

  activities[eruptionId] = {
    _id: eruptionId,
    type: "damage",
    sort: Number(guardActivity.sort ?? 0) + 500,
    name: "Guard Point: Eruption",
    img: "icons/magic/lightning/bolt-strike-smoke-yellow.webp",
    activation: {
      type: "special",
      value: null,
      condition: "When Guard Point causes the triggering melee attack to miss",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    },
    description: {
      chatFlavor: `Shield erupts for ${opts.damageFormula} ${elementalLabel(opts.elementalType)} (Elemental Attunement).`,
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: { units: "ft", value: null, special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "1",
        type: "creature",
        choice: false,
        special: "",
      },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    damage: {
      critical: { allow: false, bonus: "" },
      parts: [part],
    },
    midiProperties: defaultMidiProperties({
      identifier: "guard-point-eruption",
      displayActivityName: true,
      magicDamage: opts.magical,
      magicEffect: opts.magical,
    }),
    useConditionText:
      'foundry.utils.getProperty(actor, "flags.world.cb.mode") !== "axe"',
    useConditionReason: "Requires Sword & Shield Mode.",
    effectConditionText: "",
  };
}

function patchElementalAttunement(
  item: FoundryItem,
  elementalType: string,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const name = String(activity.name ?? "").trim();
    if (!/^elemental\s*attunement(\s*\([^)]+\))?$/i.test(name)) continue;

    const label = elementalType
      ? `Elemental Attunement (${elementalType.charAt(0).toUpperCase()}${elementalType.slice(1)})`
      : "Elemental Attunement";

    activity.name = label;
    activity.type = "utility";
    activity.img =
      "icons/magic/symbols/elements-air-earth-fire-water.webp";
    activity.activation = {
      type: "special",
      value: null,
      condition: "",
      override: false,
    };
    activity.consumption = {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    };
    activity.uses = {
      spent: 0,
      max: "1",
      recovery: [{ period: "sr", type: "recoverAll", formula: "" }],
    };
    activity.description = {
      chatFlavor: elementalType
        ? `Currently attuned to ${elementalType}. Once per Short or Long Rest, use this to change Acid / Cold / Fire / Lightning.`
        : "No element chosen yet. Once per Short or Long Rest, choose Acid, Cold, Fire, or Lightning. Discharge, AED, and Guard Point Eruption use that type.",
    };
    activity.range = { units: "self", special: "", override: false };
    activity.target = {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "self",
        choice: false,
        special: "",
      },
      prompt: false,
      override: false,
    };
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "elemental-attunement",
        displayActivityName: true,
      }),
      ...midi,
      identifier: "elemental-attunement",
      displayActivityName: true,
    };
  }
}

/** Rare+: on-hit Axe phial spend → elemental bonus damage. */
function patchElementalDischarge(
  item: FoundryItem,
  opts: { damageFormula: string; magical: boolean; elementalType: string },
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const name = String(activity.name ?? "").trim();
    if (!/^elemental\s*discharge$/i.test(name)) continue;
    if (/amped/i.test(name)) continue;

    const part = damageFieldFromFormula(
      opts.damageFormula,
      opts.elementalType,
    );

    activity.type = "damage";
    activity.name = "Elemental Discharge";
    activity.img = "icons/magic/lightning/bolt-strike-smoke-yellow.webp";
    activity.activation = {
      type: "special",
      value: null,
      condition: "When you hit a creature with an attack in Axe Mode",
      override: false,
    };
    activity.consumption = {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
    };
    activity.description = {
      chatFlavor: `Axe Mode on hit: expend 1 Phial Charge for ${opts.damageFormula} ${elementalLabel(opts.elementalType)} (Elemental Attunement). Offered automatically after an Axe hit.`,
    };
    activity.damage = {
      critical: { allow: false, bonus: "" },
      parts: [part],
    };
    activity.range = { units: "ft", value: null, special: "", override: false };
    activity.target = {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "1",
        type: "creature",
        choice: false,
        special: "",
      },
      prompt: true,
      override: false,
    };
    activity.useConditionText = axeModeUseCondition();
    activity.useConditionReason =
      "Requires Axe Mode and ≥1 Phial Charge.";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "elemental-discharge",
        displayActivityName: true,
        magicDamage: opts.magical,
        magicEffect: opts.magical,
      }),
      ...midi,
      identifier: "elemental-discharge",
      displayActivityName: true,
      magicDamage: opts.magical,
      magicEffect: opts.magical,
    };
  }
}

/**
 * Rare+: collapse AED ×N into one Action. ItemMacro dialog asks how many
 * Phial Charges to spend (1…available) and scales the NdX damage.
 */
function patchAedActivities(
  item: FoundryItem,
  opts: { magical: boolean; elementalType: string; damageFormula: string },
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const aedEntries = Object.entries(activities).filter(([, activity]) => {
    if (!activity) return false;
    const name = String(activity.name ?? "").trim();
    return /amped\s*element\s*discharge/i.test(name) && !/super/i.test(name);
  });
  if (aedEntries.length === 0) return;

  const [, keep] = aedEntries[0];
  for (const [id] of aedEntries.slice(1)) {
    delete activities[id];
  }

  const part = damageFieldFromFormula(
    opts.damageFormula,
    opts.elementalType,
  );
  // Placeholders; ItemMacro sets `number` to the chosen charge spend.
  keep.name = "Amped Element Discharge (AED)";
  keep.type = "save";
  keep.img = "icons/magic/fire/blast-jet-stream-splash.webp";
  keep.activation = {
    type: "action",
    value: 1,
    condition: "While in Axe Mode",
    override: false,
  };
  // Macro spends after the charge dialog — avoid unpaid Midi filters.
  keep.consumption = {
    scaling: { allowed: false, max: "" },
    spellSlot: false,
    targets: [],
  };
  keep.description = {
    chatFlavor: `Axe Mode Action: choose how many Phial Charges to spend (dialog). ${opts.damageFormula} ${elementalLabel(opts.elementalType)} per charge in a 15-ft cone; DEX save (DC 8 + PB + STR or DEX), half on success.`,
  };
  keep.damage = {
    parts: [part],
    onSave: "half",
  };
  keep.save = {
    ability: ["dex"],
    dc: { calculation: "str", formula: "" },
  };
  keep.target = {
    template: {
      count: "",
      contiguous: false,
      type: "cone",
      size: "15",
      width: "",
      height: "",
      units: "ft",
    },
    affects: {
      count: "",
      type: "creature",
      choice: false,
      special: "",
    },
    prompt: true,
    override: false,
  };
  keep.useConditionText = axeModeUseCondition();
  keep.useConditionReason = "Requires Axe Mode and ≥1 Phial Charge.";
  const midi =
    (keep.midiProperties as Record<string, unknown> | undefined) ?? {};
  keep.midiProperties = {
    ...defaultMidiProperties({
      identifier: "aed",
      displayActivityName: true,
      magicDamage: opts.magical,
      magicEffect: opts.magical,
    }),
    ...midi,
    identifier: "aed",
    displayActivityName: true,
    magicDamage: opts.magical,
    magicEffect: opts.magical,
  };
}

function applyChargeBladeItemMacro(
  item: FoundryItem,
  opts: {
    hasPhialCharges: boolean;
    guardPointDamage: string;
    elementalDischargeDamage: string;
    aedDamage: string;
    elementalType: string;
    swordMastery: string;
    axeMastery: string;
  },
): void {
  const existingMidi =
    (item.flags?.["midi-qol"] as Record<string, unknown> | undefined) ?? {};
  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingCb =
    (existingWorld.chargeBlade as Record<string, unknown> | undefined) ?? {};

  const macro = CHARGE_BLADE_ITEM_MACRO.replaceAll(
    "__GUARD_POINT_DAMAGE__",
    opts.guardPointDamage,
  )
    .replaceAll("__ELEMENTAL_DISCHARGE_DAMAGE__", opts.elementalDischargeDamage)
    .replaceAll("__AED_DAMAGE__", opts.aedDamage)
    .replaceAll("__ELEMENTAL_TYPE__", opts.elementalType);

  item.flags = {
    ...item.flags,
    "midi-qol": {
      ...existingMidi,
      onUseMacroName:
        "[preTargeting]ItemMacro,[preDamageRoll]ItemMacro,[postDamageRoll]ItemMacro,[postActiveEffects]ItemMacro",
      onUseMacroParts: {
        items: [
          { macroName: "ItemMacro", option: "preTargeting" },
          { macroName: "ItemMacro", option: "preDamageRoll" },
          { macroName: "ItemMacro", option: "postDamageRoll" },
          { macroName: "ItemMacro", option: "postActiveEffects" },
        ],
      },
    },
    itemacro: {
      macro: {
        name: item.name,
        type: "script",
        scope: "global",
        author: "",
        img: "icons/svg/dice-target.svg",
        command: macro,
        folder: null,
        sort: 0,
        ownership: { default: 0 },
        flags: {},
        _stats: {
          coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
          systemId: FOUNDRY_EXPORT_TARGET.systemId,
          systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
        },
      },
    },
    world: {
      ...existingWorld,
      chargeBlade: {
        ...existingCb,
        isChargeBlade: true,
        modeIndicators: true,
        hasPhialCharges: opts.hasPhialCharges,
        guardPointDamage: opts.guardPointDamage,
        elementalDischargeDamage: opts.elementalDischargeDamage,
        aedDamage: opts.aedDamage,
        elementalType: opts.elementalType,
        swordMastery: opts.swordMastery,
        axeMastery: opts.axeMastery,
      },
    },
  };
}

/**
 * Charge Blade: mode-indicator AEs (default Sword & Shield), gated Attacks,
 * Switch Mode toggle, Phial Charges on Sword hit, Guard Point AC + Eruption.
 * Rare+: Elemental Discharge (prompt on Axe hit) + single AED with spend dialog.
 */
export function applyChargeBladeOverlay(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
): boolean {
  if (!isChargeBlade(item, weapon)) return false;

  const system = item.system as Record<string, unknown>;
  const magical =
    Number((system.magicalBonus as number | null | undefined) ?? 0) > 0 ||
    (Array.isArray(system.properties) &&
      (system.properties as string[]).includes("mgc"));

  const modeIds = ensureModeIndicatorEffects(item);
  patchModeAttackGates(item);
  patchModeAttackModifiers(item, weapon);
  patchSwitchMode(item, modeIds);

  const masteries = resolveModeMasteries(weapon, rarityIndex);
  system.mastery = masteries.sword;

  const elementalType = resolveElementalType(weapon, rarityIndex);
  const guardPointDamage = resolveGuardPointDamage(weapon, rarityIndex);
  const elementalDischargeDamage = resolveElementalDischargeDamage(
    weapon,
    rarityIndex,
  );
  const aedDamage = resolveAedDamage(weapon, rarityIndex);

  const hasPhialCharges = hasFeature(
    weapon,
    rarityIndex,
    /^phial\s*charges$/i,
  );
  const hasGuardPoint = hasFeature(
    weapon,
    rarityIndex,
    /^guard\s*point(\s*\(elemental\s*guard\))?$/i,
  );

  const hasElementalAttunement = hasFeature(
    weapon,
    rarityIndex,
    /^elemental\s*attunement/i,
  );
  if (hasElementalAttunement) {
    patchElementalAttunement(item, elementalType);
  }

  if (hasGuardPoint) {
    patchGuardPoint(item, {
      damageFormula: guardPointDamage,
      magical,
      elementalType,
    });
  }

  const hasElementalDischarge = hasFeature(
    weapon,
    rarityIndex,
    /^elemental\s*discharge$/i,
  );
  if (hasElementalDischarge) {
    patchElementalDischarge(item, {
      damageFormula: elementalDischargeDamage,
      magical,
      elementalType,
    });
  }

  const hasAed = hasFeature(
    weapon,
    rarityIndex,
    /^amped\s*element\s*discharge/i,
  );
  if (hasAed) {
    patchAedActivities(item, {
      magical,
      elementalType,
      damageFormula: aedDamage,
    });
  }

  applyChargeBladeItemMacro(item, {
    hasPhialCharges,
    guardPointDamage: hasGuardPoint ? guardPointDamage : "1d4",
    elementalDischargeDamage: hasElementalDischarge
      ? elementalDischargeDamage
      : "1d6",
    aedDamage: hasAed ? aedDamage : "1d8",
    elementalType,
    swordMastery: masteries.sword,
    axeMastery: masteries.axe,
  });

  return true;
}
