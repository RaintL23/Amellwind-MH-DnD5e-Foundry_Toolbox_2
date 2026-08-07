import type { FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  defaultMidiProperties,
  EFFECT_MODE,
  FOUNDRY_EXPORT_TARGET,
  foundryIdFromSeed,
  mapDamageType,
} from "@/shared/foundry";
import {
  resolveGripModeDamage,
  resolveWeaponModeDefs,
} from "@/features/weapons/utils/weapon-mode.utils";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";
import {
  damageFieldFromFormula,
  parseDice,
} from "./weapon-forge-foundry.helpers";
import {
  listUnlockedPhialDefs,
  type PhialFeatDef,
} from "./weapon-forge-phial.export";
import { SWITCH_AXE_ITEM_MACRO } from "./switch-axe-kinetic.macro";

function activitiesOf(
  item: FoundryItem,
): Record<string, Record<string, unknown>> | undefined {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return undefined;
  return activities as Record<string, Record<string, unknown>>;
}

function isSwitchAxe(item: FoundryItem, weapon: CustomWeapon): boolean {
  return (
    /^switch\s*axe/i.test(weapon.name) || /^switch\s*axe/i.test(item.name ?? "")
  );
}

function resolveSwordDamage(weapon: CustomWeapon): {
  formula: string;
  dmgType: string | undefined;
} {
  const defs = resolveWeaponModeDefs(weapon);
  const sword = defs?.find((d) => /sword/i.test(d.label));
  if (sword) {
    return {
      formula: resolveGripModeDamage(weapon, {
        label: sword.label,
        damage: sword.damage?.trim() || weapon.dmg2 || weapon.dmg1,
        dmgType: sword.dmgType?.trim() || weapon.dmgType,
        hasShield: sword.hasShield === true,
        isTwoHanded: sword.isTwoHanded === true,
        blocksOffHand: sword.blocksOffHand === true,
      }),
      dmgType: sword.dmgType?.trim() || weapon.dmgType,
    };
  }
  return {
    formula: (weapon.dmg2 || weapon.dmg1 || "2d6").trim(),
    dmgType: weapon.dmgType,
  };
}

/**
 * Sword-mode weapon die for Discharge / ZSD.
 * `includeBase` is false (item base is Axe 1d8), so `@mod` must be on the part —
 * same as a normal weapon attack's ability modifier to damage.
 */
function swordWeaponDamagePart(weapon: CustomWeapon): Record<string, unknown> {
  const { formula, dmgType } = resolveSwordDamage(weapon);
  const part = damageFieldFromFormula(formula, dmgType);
  part.bonus = "@mod";
  return part;
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

function removeSwordAttackActivity(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const [id, activity] of Object.entries(activities)) {
    if (!activity || activity.type !== "attack") continue;
    const name = String(activity.name ?? "").trim();
    const midiId = String(
      (activity.midiProperties as { identifier?: string } | undefined)
        ?.identifier ?? "",
    );
    if (/^sword$/i.test(name) || /^sword$/i.test(midiId)) {
      delete activities[id];
    }
  }
}

function ensureModeIndicatorEffects(item: FoundryItem): {
  axeId: string;
  swordId: string;
} {
  const axeId = foundryIdFromSeed("eff-switch-axe-mode-axe");
  const swordId = foundryIdFromSeed("eff-switch-axe-mode-sword");

  const buildMode = (opts: {
    id: string;
    name: string;
    modeKey: "axe" | "sword";
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
          key: "flags.world.sa.mode",
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
          sa: {
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
    const world = (e.flags as { world?: { sa?: { isModeIndicator?: boolean } } })
      ?.world;
    if (world?.sa?.isModeIndicator) return false;
    if (/^(axe|sword)\s*mode$/i.test(e.name ?? "")) return false;
    return true;
  });

  item.effects.push(
    buildMode({
      id: axeId,
      name: "Axe Mode",
      modeKey: "axe",
      disabled: false,
      img: "icons/weapons/axes/axe-battle-black.webp",
    }),
    buildMode({
      id: swordId,
      name: "Sword Mode",
      modeKey: "sword",
      disabled: true,
      img: "icons/weapons/swords/sword-broad-crystal-paired.webp",
    }),
  );

  return { axeId, swordId };
}

function patchAxeAttackGate(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const activity of Object.values(activities)) {
    if (!activity || activity.type !== "attack") continue;
    const name = String(activity.name ?? "").trim();
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    const midiId = String(midi.identifier ?? "");
    if (!/^axe$/i.test(name) && !/^axe$/i.test(midiId)) continue;
    activity.useConditionText =
      'foundry.utils.getProperty(actor, "flags.world.sa.mode") !== "sword"';
    activity.useConditionReason =
      "Requires Axe Mode (use Fluid Morph to switch).";
    activity.midiProperties = {
      ...midi,
      identifier: "axe",
      triggeredActivityId: "none",
      triggeredActivityConditionText: "",
      triggeredActivityTargets: "targets",
      displayActivityName: true,
    };
  }
}

function patchFluidMorph(
  item: FoundryItem,
  modeEffectIds: { axeId: string; swordId: string },
): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    if (!/^fluid\s*morph$/i.test(String(activity.name ?? "").trim())) continue;
    activity.activation = {
      type: "bonus",
      value: 1,
      condition: "Or once per turn after the Attack action (no action)",
      override: false,
    };
    activity.description = {
      chatFlavor:
        "Toggle Axe Mode ↔ Sword Mode. Item Macro updates the mode indicator AE.",
    };
    activity.effects = [
      { _id: modeEffectIds.axeId },
      { _id: modeEffectIds.swordId },
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
        identifier: "fluid-morph",
        displayActivityName: true,
      }),
      ...midi,
      identifier: "fluid-morph",
      displayActivityName: true,
      toggleEffect: false,
    };
  }
}

function patchZeroSumDischargeForSwordMode(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const swordPart = swordWeaponDamagePart(weapon);
  const hasSplash = hasFeature(
    weapon,
    rarityIndex,
    /^zero\s*sum\s*discharge\s*splash$/i,
  );

  let zsdActivity: Record<string, unknown> | undefined;

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const name = String(activity.name ?? "");
    if (!/zero\s*sum\s*discharge/i.test(name)) continue;
    if (activity.type !== "attack") continue;
    if (/splash$/i.test(name) && !/discharge\s*splash/i.test(name)) continue;

    const damage = (activity.damage as Record<string, unknown> | undefined) ?? {
      critical: { bonus: "" },
      includeBase: true,
      parts: [],
    };
    const parts = Array.isArray(damage.parts)
      ? [...(damage.parts as Record<string, unknown>[])]
      : [];

    // Drop any prior sword die without @mod so re-export stays clean.
    const phialParts = parts.filter((part) => {
      const dice = parseDice(
        `${String(part.number ?? "")}d${String(part.denomination ?? "")}`,
      );
      const swordDice = parseDice(String(swordPart.number) + "d" + String(swordPart.denomination));
      if (
        swordDice &&
        dice &&
        dice.number === swordDice.number &&
        dice.denomination === swordDice.denomination
      ) {
        return false;
      }
      return true;
    });

    damage.includeBase = false;
    damage.parts = [swordPart, ...phialParts];
    activity.damage = damage;
    activity.activation = {
      type: "action",
      value: 1,
      condition: hasSplash
        ? "Sword Mode with at least 2 Phial Charges (Splash on hit or miss)"
        : "Sword Mode with at least 2 Phial Charges",
      override: false,
    };
    activity.useConditionText =
      'foundry.utils.getProperty(actor, "flags.world.sa.mode") === "sword"';
    activity.useConditionReason =
      "Requires Sword Mode (Fluid Morph). Needs ≥2 Phial Charges.";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      identifier: "zero-sum-discharge",
      displayActivityName: true,
    };
    if (hasSplash) {
      activity.description = {
        ...(typeof activity.description === "object" && activity.description
          ? (activity.description as Record<string, unknown>)
          : {}),
        chatFlavor:
          "ZSD with Splash: thrust with advantage. Then use / auto-trigger ZSD Splash DEX save (5 ft of target, hit or miss).",
      };
      // Prefer a clean name without the counter_spend "(scale)" suffix.
      if (/\(scale\)$/i.test(String(activity.name ?? ""))) {
        activity.name = "Zero Sum Discharge Splash";
      }
    }
    zsdActivity = activity;
  }

  if (hasSplash && zsdActivity) {
    emitZsdSplashSave(item, zsdActivity);
  }
}

/** DEX save radius 5 ft — half of the ZSD Phial explosion (adjust dice to match). */
function emitZsdSplashSave(
  item: FoundryItem,
  zsdActivity: Record<string, unknown>,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const splashId = foundryIdFromSeed("act-zsd-splash-save");
  const splash: Record<string, unknown> = {
    _id: splashId,
    type: "save",
    sort: Number(zsdActivity.sort ?? 0) + 500,
    name: "ZSD Splash",
    img: "icons/magic/fire/explosion-fireball-medium-orange.webp",
    activation: {
      type: "special",
      value: null,
      condition: "After Zero Sum Discharge Splash (hit or miss)",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    },
    description: {
      chatFlavor:
        "Creatures within 5 ft of the ZSD target (other than you): DEX save or take half the Phial explosion damage you just rolled. Replace the dice with half of that total.",
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: { value: null, units: "ft", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "radius",
        size: "5",
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
    },
    uses: { spent: 0, max: "", recovery: [] },
    damage: {
      parts: [
        {
          number: 2,
          denomination: 10,
          types: [],
          custom: { enabled: false, formula: "" },
          scaling: { mode: "", number: 1 },
          bonus: "",
        },
      ],
      onSave: "half",
    },
    save: {
      ability: ["dex"],
      dc: { calculation: "str", formula: "" },
    },
    midiProperties: defaultMidiProperties({
      identifier: "zsd-splash",
      displayActivityName: true,
      automationOnly: false,
    }),
    useConditionText:
      'foundry.utils.getProperty(actor, "flags.world.sa.mode") === "sword"',
    useConditionReason: "Requires Sword Mode.",
    effectConditionText: "",
  };
  activities[splashId] = splash;

  const midi =
    (zsdActivity.midiProperties as Record<string, unknown> | undefined) ?? {};
  zsdActivity.midiProperties = {
    ...midi,
    triggeredActivityId: splashId,
    // Fire on hit or miss (Splash text).
    triggeredActivityConditionText: "true",
    triggeredActivityTargets: "targets",
    triggeredActivityRollAs: "self",
  };
}

function damagePartFromPhial(def: PhialFeatDef): Record<string, unknown> {
  const dice = parseDice(def.damageFormula) ?? { number: 1, denomination: 6 };
  const mapped = def.damageType
    ? mapDamageType(def.damageType) || def.damageType.toLowerCase()
    : "";
  return {
    number: dice.number,
    denomination: dice.denomination,
    types: mapped ? [mapped] : [],
    custom: { enabled: false, formula: "" },
    scaling: { mode: "", number: 1 },
    bonus: "",
  };
}

/**
 * Sword Mode strike = Phial Discharge Attack (weapon 2d6 + phial), not a Sword Attack.
 */
function patchPhialDischargeActivities(
  item: FoundryItem,
  weapon: CustomWeapon,
  unlocked: PhialFeatDef[],
  magical: boolean,
): void {
  if (unlocked.length === 0) return;
  const activities = activitiesOf(item);
  if (!activities) return;

  const dischargeEntry = Object.entries(activities).find(([, activity]) =>
    /^phial\s*discharge(\s*\(|$)/i.test(String(activity?.name ?? "").trim()),
  );
  if (!dischargeEntry) return;

  const [, baseActivity] = dischargeEntry;
  const primary = unlocked[0];
  const rest = unlocked.slice(1);
  const swordPart = swordWeaponDamagePart(weapon);

  // Clear prior rare variants so re-export is clean.
  for (const [id, activity] of Object.entries(activities)) {
    if (activity === baseActivity) continue;
    if (/^phial\s*discharge\s*\(/i.test(String(activity?.name ?? ""))) {
      delete activities[id];
    }
    if (/^poison\s*phial\s*\(/i.test(String(activity?.name ?? ""))) {
      delete activities[id];
    }
  }
  item.effects = item.effects.filter((e) => {
    const world = (e.flags as { world?: { sa?: { phialRider?: boolean } } })
      ?.world;
    return !world?.sa?.phialRider;
  });

  applyPhialToDischargeActivity(item, baseActivity, primary, magical, swordPart);
  baseActivity.name = `Phial Discharge (${primary.name.replace(/\s*Phial$/i, "").trim()})`;

  let sortBump = 1000;
  for (const def of rest) {
    const id = foundryIdFromSeed(`act-phial-discharge-${def.phialKey}`);
    const clone = structuredClone(baseActivity) as Record<string, unknown>;
    clone._id = id;
    applyPhialToDischargeActivity(item, clone, def, magical, swordPart);
    clone.name = `Phial Discharge (${def.name.replace(/\s*Phial$/i, "").trim()})`;
    clone.sort = Number(baseActivity.sort ?? 0) + sortBump;
    sortBump += 1000;
    activities[id] = clone;
  }
}

function phialDischargeChatFlavor(def: PhialFeatDef): string {
  const base = `Sword Mode attack: 2d6 Slashing + ${def.name} (${def.damageFormula}${
    def.damageType ? ` ${def.damageType}` : ""
  }). Expends 1 Phial Charge.`;
  return def.rider?.chatFlavor
    ? `${base} ${def.rider.chatFlavor}`
    : base;
}

function applyPhialToDischargeActivity(
  item: FoundryItem,
  activity: Record<string, unknown>,
  def: PhialFeatDef,
  magical: boolean,
  swordPart: Record<string, unknown>,
): void {
  activity.type = "attack";
  activity.activation = {
    type: "action",
    value: 1,
    condition: "Sword Mode — Attack action (expends 1 Phial Charge)",
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
    chatFlavor: phialDischargeChatFlavor(def),
  };
  activity.attack = {
    ability: "",
    type: { value: "melee", classification: "weapon" },
    critical: { threshold: null },
    flat: false,
    bonus: "",
  };
  activity.damage = {
    critical: { bonus: "" },
    includeBase: false,
    parts: [swordPart, damagePartFromPhial(def)],
  };
  activity.useConditionText =
    'foundry.utils.getProperty(actor, "flags.world.sa.mode") === "sword"';
  activity.useConditionReason =
    "Requires Sword Mode (Fluid Morph). Needs ≥1 Phial Charge.";
  activity.range = { units: "self", override: false };
  activity.target = {
    template: { contiguous: false, units: "ft" },
    affects: { choice: false },
    override: false,
    prompt: true,
  };
  activity.effects = [];
  const midi =
    (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
  activity.midiProperties = {
    ...defaultMidiProperties({
      identifier: `phial-discharge-${def.phialKey}`,
      displayActivityName: true,
      magicDamage: magical,
      magicEffect: magical,
    }),
    ...midi,
    identifier: `phial-discharge-${def.phialKey}`,
    displayActivityName: true,
    magicDamage: magical,
    magicEffect: magical,
    triggeredActivityId: "none",
    triggeredActivityConditionText: "",
  };

  attachPhialRider(item, activity, def, magical);
}

function attachPhialRider(
  item: FoundryItem,
  activity: Record<string, unknown>,
  def: PhialFeatDef,
  magical: boolean,
): void {
  const rider = def.rider;
  if (!rider) return;
  const activities = activitiesOf(item);
  if (!activities) return;

  if (rider.kind === "exhaust") {
    const effectId = foundryIdFromSeed(`eff-phial-exhaust-${def.phialKey}`);
    const effect = buildEffect({
      name: "Exhaust Phial",
      img: def.img,
      transfer: false,
      disabled: false,
      changes: [
        {
          key: "system.attributes.movement.walk",
          mode: EFFECT_MODE.ADD,
          value: String(-(rider.speedPenalty ?? 10)),
          priority: 20,
        },
      ],
      flags: {
        dae: {
          specialDuration: ["turnStart"],
          stackable: "noneName",
          showIcon: true,
          selfTarget: false,
        },
        world: { sa: { phialRider: true, phialKey: def.phialKey } },
      },
    });
    effect._id = effectId;
    effect.duration = {
      ...effect.duration,
      rounds: 1,
      turns: null,
      seconds: null,
      startTime: null,
      startRound: null,
      startTurn: null,
      combat: null,
    };
    item.effects.push(effect);
    activity.effects = [{ _id: effectId }];
    activity.effectConditionText = "hits > 0";
    return;
  }

  if (rider.kind === "poison") {
    const saveId = foundryIdFromSeed(`act-phial-poison-save-${def.phialKey}`);
    const saveAbility = (rider.saveAbility ?? "con").toLowerCase().slice(0, 3);
    activities[saveId] = {
      _id: saveId,
      type: "save",
      sort: Number(activity.sort ?? 0) + 100,
      name: "Poison Phial (Save)",
      img: def.img,
      activation: {
        type: "special",
        value: null,
        condition: "On hit with Poison Phial Discharge",
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
      description: {
        chatFlavor:
          rider.chatFlavor ??
          "CON save (DC 8 + PB + STR) or Poisoned until the end of its next turn.",
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
      damage: { parts: [], onSave: "none" },
      save: {
        ability: [saveAbility],
        dc: { calculation: "str", formula: "" },
      },
      midiProperties: defaultMidiProperties({
        identifier: `poison-phial-save`,
        displayActivityName: true,
        magicEffect: magical,
      }),
      useConditionText: "",
      useConditionReason: "",
      effectConditionText: "",
    };

    // Poisoned status AE on failed save — leave statuses for Midi/manual apply.
    const poisonEfId = foundryIdFromSeed(`eff-phial-poison-${def.phialKey}`);
    const poisonEf = buildEffect({
      name: "Poisoned (Poison Phial)",
      img: def.img,
      transfer: false,
      statuses: rider.statuses ?? ["poisoned"],
      changes: [],
      flags: {
        dae: {
          specialDuration: ["turnEnd"],
          stackable: "noneName",
          showIcon: true,
        },
        world: { sa: { phialRider: true, phialKey: def.phialKey } },
      },
    });
    poisonEf._id = poisonEfId;
    item.effects.push(poisonEf);
    const saveAct = activities[saveId] as Record<string, unknown>;
    saveAct.effects = [{ _id: poisonEfId }];

    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      triggeredActivityId: saveId,
      triggeredActivityConditionText: "hits > 0",
      triggeredActivityTargets: "hit",
      triggeredActivityRollAs: "self",
    };
  }
}

function stripKineticActivity(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const [id, activity] of Object.entries(activities)) {
    if (/^kinetic\s*generator$/i.test(String(activity?.name ?? "").trim())) {
      delete activities[id];
    }
  }
}

function applySwitchAxeItemMacro(
  item: FoundryItem,
  opts: { hasKinetic: boolean },
): void {
  const existingMidi =
    (item.flags?.["midi-qol"] as Record<string, unknown> | undefined) ?? {};
  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingSa =
    (existingWorld.switchAxe as Record<string, unknown> | undefined) ?? {};

  item.flags = {
    ...item.flags,
    "midi-qol": {
      ...existingMidi,
      onUseMacroName:
        "[preTargeting]ItemMacro,[postDamageRoll]ItemMacro,[postActiveEffects]ItemMacro",
      onUseMacroParts: {
        items: [
          { macroName: "ItemMacro", option: "preTargeting" },
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
        command: SWITCH_AXE_ITEM_MACRO,
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
      switchAxe: {
        ...existingSa,
        hasKineticGenerator: opts.hasKinetic,
        modeIndicators: true,
      },
    },
  };
}

/**
 * Switch Axe: mode-indicator AEs, Axe-only Attack, Sword strike via Phial Discharge,
 * Fluid Morph toggle, Kinetic / ZSD / 0-charge ItemMacro.
 */
export function applySwitchAxeOverlay(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
): boolean {
  if (!isSwitchAxe(item, weapon)) return false;

  const system = item.system as Record<string, unknown>;
  const magical =
    Number((system.magicalBonus as number | null | undefined) ?? 0) > 0 ||
    (Array.isArray(system.properties) &&
      (system.properties as string[]).includes("mgc"));

  removeSwordAttackActivity(item);
  stripKineticActivity(item);

  const modeIds = ensureModeIndicatorEffects(item);
  patchAxeAttackGate(item);
  patchFluidMorph(item, modeIds);
  patchZeroSumDischargeForSwordMode(item, weapon, rarityIndex);

  const unlocked = listUnlockedPhialDefs(weapon, rarityIndex);
  patchPhialDischargeActivities(item, weapon, unlocked, magical);

  const hasKinetic = hasFeature(
    weapon,
    rarityIndex,
    /^kinetic\s*generator$/i,
  );
  applySwitchAxeItemMacro(item, { hasKinetic });

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingSa =
    (existingWorld.switchAxe as Record<string, unknown> | undefined) ?? {};
  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      switchAxe: {
        ...existingSa,
        isSwitchAxe: true,
        unlockedPhials: unlocked.map((d) => d.phialKey),
      },
    },
  };

  return true;
}
