import type { FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  defaultMidiProperties,
  EFFECT_MODE,
  foundryIdFromSeed,
  embedItemMacro,
} from "@/shared/foundry";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";
import { damageFieldFromFormula } from "./weapon-forge-foundry.helpers";
import { HAMMER_ITEM_MACRO } from "./hammer.macro";

function activitiesOf(
  item: FoundryItem,
): Record<string, Record<string, unknown>> | undefined {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return undefined;
  return activities as Record<string, Record<string, unknown>>;
}

function isHammer(item: FoundryItem, weapon: CustomWeapon): boolean {
  return /^hammer$/i.test(weapon.name.trim()) || /^hammer\b/i.test(item.name ?? "");
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

function resolveHammerTier(
  weapon: CustomWeapon,
  rarityIndex: number,
): "uncommon" | "rare" | "veryRare" | "legendary" {
  const rarity = weapon.rarityRows[rarityIndex]?.rarity ?? "";
  if (/legendary/i.test(rarity)) return "legendary";
  if (/very\s*rare/i.test(rarity)) return "veryRare";
  if (/rare/i.test(rarity)) return "rare";
  return "uncommon";
}

/** Power Charge extra damage: 1d6 → 2d6 → 3d6 → 4d6. */
function resolvePowerChargeDice(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  if (hasFeature(weapon, rarityIndex, /^charge\s*upgrade\s*iii$/i)) return "4d6";
  if (hasFeature(weapon, rarityIndex, /^charge\s*upgrade\s*ii$/i)) return "3d6";
  if (hasFeature(weapon, rarityIndex, /^charge\s*upgrade\s*i$/i)) return "2d6";
  return "1d6";
}

function findActivityByName(
  activities: Record<string, Record<string, unknown>>,
  re: RegExp,
): Record<string, unknown> | undefined {
  return Object.values(activities).find((a) =>
    re.test(String(a?.name ?? "").trim()),
  );
}

function ensureNamedAttack(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const activity of Object.values(activities)) {
    if (!activity || activity.type !== "attack") continue;
    const name = String(activity.name ?? "").trim();
    if (name !== "" && name.toLowerCase() !== "attack") continue;
    activity.name = "Attack";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      identifier: "attack",
      displayActivityName: true,
    };
    if (!activity.attackMode) activity.attackMode = "twoHanded";
  }
}

function ensurePowerCharge(
  item: FoundryItem,
  chargeDice: string,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const powerId = foundryIdFromSeed("act-hammer-power-charge");
  const effectId = foundryIdFromSeed("eff-hammer-power-charge");

  // Remove misnamed Charge Upgrade leaf activities.
  for (const [id, activity] of Object.entries(activities)) {
    if (/^charge\s*upgrade/i.test(String(activity?.name ?? "").trim())) {
      delete activities[id];
    }
  }

  let power = findActivityByName(activities, /^power\s*charge$/i);
  if (!power) {
    activities[powerId] = {
      _id: powerId,
      type: "utility",
      sort: 200000,
      name: "Power Charge",
      img: "icons/skills/melee/strike-hammer-destructive-orange.webp",
      activation: {
        type: "bonus",
        value: 1,
        condition: "",
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
      description: { chatFlavor: "" },
      duration: {
        value: "1",
        units: "minute",
        concentration: false,
        override: false,
      },
      effects: [{ _id: effectId }],
      range: { units: "self", special: "", override: false },
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
          count: "",
          type: "self",
          choice: false,
          special: "",
        },
        prompt: false,
        override: false,
      },
      uses: { spent: 0, max: "", recovery: [] },
      midiProperties: {
        ...defaultMidiProperties(),
        identifier: "power-charge",
        displayActivityName: true,
        toggleEffect: true,
      },
      otherActivityId: "none",
    };
    power = activities[powerId];
  }

  power!.name = "Power Charge";
  power!.img = "icons/skills/melee/strike-hammer-destructive-orange.webp";
  (power!.description as { chatFlavor: string }).chatFlavor =
    `+5 walk; next hit with this hammer deals +${chargeDice} bludgeoning. Ends on hit, Prone, or Incapacitated.`;
  power!.duration = {
    value: "1",
    units: "minute",
    concentration: false,
    override: false,
  };
  power!.effects = [{ _id: effectId }];
  power!.range = { units: "self", special: "", override: false };
  power!.target = {
    template: {
      count: "",
      contiguous: false,
      type: "",
      size: "",
      width: "",
      height: "",
      units: "ft",
    },
    affects: { count: "", type: "self", choice: false, special: "" },
    prompt: false,
    override: false,
  };
  const midi =
    (power!.midiProperties as Record<string, unknown> | undefined) ?? {};
  power!.midiProperties = {
    ...defaultMidiProperties(),
    ...midi,
    identifier: "power-charge",
    displayActivityName: true,
    toggleEffect: true,
  };

  // Replace any existing Power Charge AE.
  item.effects = item.effects.filter(
    (e) => !/^power\s*charge$/i.test(e.name ?? ""),
  );
  const powerEffect = buildEffect({
    name: "Power Charge",
    img: "icons/skills/melee/strike-hammer-destructive-orange.webp",
    transfer: false,
    disabled: false,
    description: `<p>+5 walking speed. Next successful attack with this hammer deals an extra ${chargeDice} bludgeoning. Ends on hit (Item Macro), Prone, or Incapacitated.</p>`,
    changes: [
      {
        key: "system.attributes.movement.walk",
        mode: EFFECT_MODE.ADD,
        value: "5",
        priority: 20,
      },
      {
        key: "system.bonuses.mwak.damage",
        mode: EFFECT_MODE.ADD,
        value: chargeDice,
        priority: 20,
      },
    ],
    duration: { seconds: 60 },
    flags: {
      dae: {
        disableIncapacitated: true,
        showIcon: true,
        stackable: "noneName",
        specialDuration: ["isIncapacitated", "isProne"],
        dontApply: false,
      },
      world: {
        hammer: {
          isPowerCharged: true,
        },
      },
    },
  });
  powerEffect._id = effectId;
  item.effects.push(powerEffect);
}

function ensureMightyWeapon(
  item: FoundryItem,
  stunUpgrade: boolean,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const mightyId = foundryIdFromSeed("act-hammer-mighty-weapon");
  const stunEffectId = foundryIdFromSeed("eff-hammer-mighty-stunned");

  for (const [id, activity] of Object.entries(activities)) {
    if (/^stun\s*upgrade$/i.test(String(activity?.name ?? "").trim())) {
      delete activities[id];
    }
  }

  let mighty = findActivityByName(activities, /^mighty\s*weapon$/i);
  if (!mighty) {
    activities[mightyId] = {
      _id: mightyId,
      type: "save",
      sort: 300000,
      name: "Mighty Weapon",
      img: "icons/skills/melee/strike-flail-destructive-yellow.webp",
      activation: {
        type: "special",
        value: null,
        condition:
          "Requires active Power Charge (or a charged hit this turn).",
        override: false,
      },
      consumption: {
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
      },
      description: { chatFlavor: "" },
      duration: {
        value: "",
        units: "inst",
        concentration: false,
        override: false,
      },
      effects: [{ _id: stunEffectId }],
      range: { units: "self", special: "", override: false },
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
        ability: ["con"],
        dc: { calculation: "str", formula: "" },
      },
      midiProperties: {
        ...defaultMidiProperties(),
        identifier: "mighty-weapon",
        displayActivityName: true,
      },
    };
    mighty = activities[mightyId];
  }

  mighty!.name = "Mighty Weapon";
  mighty!.type = "save";
  (mighty!.description as { chatFlavor: string }).chatFlavor = stunUpgrade
    ? "CON save vs Hammer DC (8 + PB + STR) or Stunned until end of your next turn. Requires Power Charge (or a charged hit this turn). Huge+ no longer have Advantage (Stun Upgrade). Limited Uses on the weapon item."
    : "CON save vs Hammer DC (8 + PB + STR) or Stunned until end of your next turn. Requires Power Charge (or a charged hit this turn). Huge+ have Advantage. Limited Uses on the weapon item.";
  mighty!.consumption = {
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
  mighty!.effects = [{ _id: stunEffectId }];
  const midi =
    (mighty!.midiProperties as Record<string, unknown> | undefined) ?? {};
  mighty!.midiProperties = {
    ...defaultMidiProperties(),
    ...midi,
    identifier: "mighty-weapon",
    displayActivityName: true,
  };

  const system = item.system as Record<string, unknown>;
  system.uses = {
    spent: 0,
    max: "1",
    recovery: [{ period: "sr", type: "recoverAll", formula: "" }],
  };

  item.effects = item.effects.filter(
    (e) =>
      !/^mighty\s*weapon/i.test(e.name ?? "") &&
      !/^stun\s*upgrade/i.test(e.name ?? ""),
  );
  const stunEffect = buildEffect({
    name: "Mighty Weapon (Stunned)",
    img: "icons/magic/control/silhouette-fall-slip-prone.webp",
    transfer: false,
    disabled: false,
    statuses: ["stunned"],
    changes: [],
    duration: { rounds: 1 },
    flags: {
      dae: {
        specialDuration: ["turnEndSource"],
        stackable: "noneName",
        showIcon: true,
        dontApply: false,
      },
    },
  });
  stunEffect._id = stunEffectId;
  item.effects.push(stunEffect);
}

function ensureUpswingSplit(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const [id, activity] of Object.entries(activities)) {
    if (
      /^upswing\s*\/\s*spinning\s*bludgeon$/i.test(
        String(activity?.name ?? "").trim(),
      )
    ) {
      delete activities[id];
    }
  }

  const upswingId = foundryIdFromSeed("act-hammer-upswing");
  const collisionId = foundryIdFromSeed("act-hammer-upswing-collision");
  const spinId = foundryIdFromSeed("act-hammer-spinning-bludgeon");

  if (!findActivityByName(activities, /^upswing$/i)) {
    activities[upswingId] = {
      _id: upswingId,
      type: "utility",
      sort: 400000,
      name: "Upswing",
      img: "icons/skills/melee/strike-axe-blood-red.webp",
      activation: {
        type: "special",
        value: null,
        condition: "After a Power Charge hit this turn",
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
      description: {
        chatFlavor:
          "Push the target 10 ft away. If they hit a solid object/creature, use Upswing: Collision.",
      },
      duration: {
        value: "",
        units: "inst",
        concentration: false,
        override: false,
      },
      effects: [],
      range: { units: "self", special: "", override: false },
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
      midiProperties: {
        ...defaultMidiProperties(),
        identifier: "upswing",
        displayActivityName: true,
      },
    };
  }

  if (!findActivityByName(activities, /^upswing:\s*collision$/i)) {
    activities[collisionId] = {
      _id: collisionId,
      type: "damage",
      sort: 410000,
      name: "Upswing: Collision",
      img: "icons/skills/melee/strike-axe-blood-red.webp",
      activation: {
        type: "special",
        value: null,
        condition:
          "If Upswing pushes the target into a solid object or creature",
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
      description: {
        chatFlavor:
          "Additional 1d6 bludgeoning when Upswing drives the target into a solid object or creature.",
      },
      duration: {
        value: "",
        units: "inst",
        concentration: false,
        override: false,
      },
      effects: [],
      range: { units: "self", special: "", override: false },
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
        critical: { bonus: "" },
        parts: [damageFieldFromFormula("1d6", "B")],
      },
      midiProperties: {
        ...defaultMidiProperties(),
        identifier: "upswing-collision",
        displayActivityName: true,
      },
    };
  }

  if (!findActivityByName(activities, /^spinning\s*bludgeon$/i)) {
    activities[spinId] = {
      _id: spinId,
      type: "attack",
      sort: 420000,
      name: "Spinning Bludgeon",
      img: "icons/skills/melee/blade-tips-triple-steel.webp",
      activation: {
        type: "special",
        value: null,
        condition:
          "After a Power Charge hit; second creature within 5 ft of the original target",
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
      description: {
        chatFlavor:
          "Extra melee attack vs a second creature within 5 ft of the original target (no Power Charge bonus).",
      },
      duration: {
        value: "",
        units: "inst",
        concentration: false,
        override: false,
      },
      effects: [],
      range: { units: "self", special: "", override: false },
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
        critical: { bonus: "" },
        includeBase: true,
        parts: [],
      },
      attack: {
        ability: "",
        bonus: "",
        critical: { threshold: null },
        flat: false,
        type: { value: "melee", classification: "weapon" },
      },
      attackMode: "twoHanded",
      midiProperties: {
        ...defaultMidiProperties(),
        identifier: "spinning-bludgeon",
        displayActivityName: true,
      },
    };
  }
}

function polishOffsetAndBigBang(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const offset = findActivityByName(activities, /^offset\s*smash$/i);
  if (offset) {
    offset.type = "attack";
    (offset.description as { chatFlavor?: string }).chatFlavor =
      "Reaction attack when a creature within reach misses you with a melee attack. If Power Charge is active: Advantage + charge damage (Item Macro).";
    const midi =
      (offset.midiProperties as Record<string, unknown> | undefined) ?? {};
    offset.midiProperties = {
      ...defaultMidiProperties(),
      ...midi,
      identifier: "offset-smash",
      displayActivityName: true,
    };
    if (!offset.attackMode) offset.attackMode = "twoHanded";
  }

  const bigBang = findActivityByName(activities, /^big\s*bang\s*combo$/i);
  if (bigBang) {
    bigBang.type = "damage";
    (bigBang.description as { chatFlavor?: string }).chatFlavor =
      "When you hit a Prone or Stunned creature: +2d6 bludgeoning. If also Power Charged, roll charge dice twice (Item Macro reminds).";
    bigBang.damage = {
      critical: { bonus: "" },
      parts: [damageFieldFromFormula("2d6", "B")],
    };
    const midi =
      (bigBang.midiProperties as Record<string, unknown> | undefined) ?? {};
    bigBang.midiProperties = {
      ...defaultMidiProperties(),
      ...midi,
      identifier: "big-bang-combo",
      displayActivityName: true,
    };
  }
}

/**
 * Hammer Uncommon+: Power Charge AE, Mighty Weapon uses, Upswing split,
 * Offset/Big Bang polish, and Item Macro gates.
 */
export function applyHammerOverlay(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
): boolean {
  if (!isHammer(item, weapon)) return false;
  if (!hasFeature(weapon, rarityIndex, /^power\s*charge$/i)) return false;

  const tier = resolveHammerTier(weapon, rarityIndex);
  const chargeDice = resolvePowerChargeDice(weapon, rarityIndex);
  const stunUpgrade = hasFeature(weapon, rarityIndex, /^stun\s*upgrade$/i);
  const bigBangCombo = hasFeature(weapon, rarityIndex, /^big\s*bang\s*combo$/i);
  const hasUpswing = hasFeature(
    weapon,
    rarityIndex,
    /^upswing\s*\/\s*spinning\s*bludgeon$/i,
  );

  ensureNamedAttack(item);
  ensurePowerCharge(item, chargeDice);
  ensureMightyWeapon(item, stunUpgrade);
  if (hasUpswing) ensureUpswingSplit(item);
  polishOffsetAndBigBang(item);

  embedItemMacro(item, {
    command: HAMMER_ITEM_MACRO,
    passes: ["preItemRoll", "postActiveEffects"],
  });

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingHammer =
    (existingWorld.hammer as Record<string, unknown> | undefined) ?? {};

  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      hammer: {
        ...existingHammer,
        isHammer: true,
        tier,
        stunUpgrade,
        bigBangCombo,
        chargeDice,
      },
    },
  };

  return true;
}
