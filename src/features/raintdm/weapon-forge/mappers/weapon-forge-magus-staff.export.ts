import type { FoundryItem } from "@/shared/foundry";
import {
  defaultMidiProperties,
  embedItemMacro,
} from "@/shared/foundry";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { MAGUS_STAFF_ITEM_MACRO } from "./magus-staff.macro";

function activitiesOf(
  item: FoundryItem,
): Record<string, Record<string, unknown>> | undefined {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return undefined;
  return activities as Record<string, Record<string, unknown>>;
}

function isMagusStaff(item: FoundryItem, weapon: CustomWeapon): boolean {
  return (
    /^magus\s*staff$/i.test(weapon.name.trim()) ||
    /^magus staff\b/i.test(item.name ?? "") ||
    String(
      (item.system as { identifier?: string } | undefined)?.identifier ?? "",
    ) === "magusstaff"
  );
}

function activityMeta(activity: Record<string, unknown>): {
  name: string;
  id: string;
} {
  const midi = activity.midiProperties as Record<string, unknown> | undefined;
  return {
    name: String(activity.name ?? "").trim().toLowerCase(),
    id: String(midi?.identifier ?? activity.identifier ?? "")
      .trim()
      .toLowerCase(),
  };
}

function isDefaultAttack(activity: Record<string, unknown>): boolean {
  const { name, id } = activityMeta(activity);
  if (activity.type !== "attack") return false;
  return name === "" || name === "attack" || id === "attack";
}

function patchDefaultAttackName(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const activity of Object.values(activities)) {
    if (!activity || !isDefaultAttack(activity)) continue;
    activity.name = "Attack";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      identifier: "attack",
      displayActivityName: true,
    };
  }
}

function ensureFocusProperty(item: FoundryItem, weapon: CustomWeapon): void {
  if (!weapon.isFocus) return;
  const system = item.system as Record<string, unknown>;
  const props = Array.isArray(system.properties)
    ? [...(system.properties as string[])]
    : [];
  if (!props.includes("foc")) props.push("foc");
  system.properties = props.sort((a, b) => a.localeCompare(b));
}

function resolveMagusStaffTier(item: FoundryItem): string {
  const system = item.system as Record<string, unknown>;
  const rarity = String(system.rarity ?? "common")
    .toLowerCase()
    .replace(/\s+/g, "");
  if (rarity === "veryrare") return "veryRare";
  return rarity || "common";
}

function spellCoreMax(item: FoundryItem): number {
  const system = item.system as Record<string, unknown>;
  const uses = system.uses as { max?: unknown } | undefined;
  const n = Number.parseInt(String(uses?.max ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function dischargeDieAtTier(tier: string): string {
  if (tier === "legendary") return "1d10";
  if (tier === "veryRare") return "1d8";
  return "1d6";
}

function patchHarvestMagic(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (id !== "harvest-magic" && !name.includes("harvest magic")) continue;

    activity.name = "Harvest Magic";
    activity.type = "utility";
    activity.img = "icons/magic/symbols/runes-triangle-magenta.webp";
    activity.activation = {
      type: "special",
      value: null,
      condition: "When you deal damage to a hostile creature with a Cantrip",
      override: false,
    };
    activity.consumption = {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    };
    activity.description = {
      chatFlavor:
        "After cantrip damage to a hostile: Item Macro asks range. Recover 1 Spell Counter (2 if the target was within 15 ft). Caps at the Spell Core maximum. Counters clear on a Short or Long Rest (set Spent to max).",
    };
    activity.range = {
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
    activity.roll = {
      formula: "",
      name: "",
      prompt: false,
      visible: false,
    };
    activity.useConditionText = "@item.uses.value < @item.uses.max";
    activity.useConditionReason = "Spell Core is already full.";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "harvest-magic",
        displayActivityName: true,
      }),
      ...midi,
      identifier: "harvest-magic",
      displayActivityName: true,
    };
  }
}

function patchArcaneDischarge(item: FoundryItem, tier: string): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  const maxCounters = spellCoreMax(item);
  if (maxCounters <= 0) return;

  const die = dischargeDieAtTier(tier);
  const spendMin = 1;
  const spendMax = maxCounters;
  const scaleMax = Math.max(0, spendMax - spendMin);

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (
      !id.includes("arcane-discharge") &&
      !name.includes("arcane discharge")
    ) {
      continue;
    }

    activity.name = "Arcane Discharge";
    activity.type = "damage";
    activity.img = "icons/magic/lightning/bolt-strike-sparks-teal.webp";
    activity.activation = {
      type: "special",
      value: null,
      condition:
        "When you cast a leveled Instantaneous spell that deals damage",
      override: false,
    };
    activity.consumption = {
      scaling: { allowed: true, max: String(scaleMax) },
      spellSlot: false,
      targets: [
        {
          type: "itemUses",
          target: "",
          value: String(spendMin),
          scaling: { mode: "amount", formula: "" },
        },
      ],
    };
    activity.description = {
      chatFlavor:
        `When casting a damaging leveled Instantaneous spell: expend Spell Counters (scale this activity). For each counter, one affected target takes an extra ${die} of the spell's damage type. Base ${spendMin}; max ${spendMax}.`,
    };
    activity.useConditionText = "@item.uses.value >= 1";
    activity.useConditionReason = "No Spell Counters available.";

    const damage = activity.damage as Record<string, unknown> | undefined;
    const parts = damage?.parts as Record<string, unknown>[] | undefined;
    const dieMatch = /^(\d+)d(\d+)$/i.exec(die);
    if (parts?.[0] && dieMatch) {
      parts[0] = {
        ...parts[0],
        number: Number(dieMatch[1]),
        denomination: Number(dieMatch[2]),
        types: [],
        scaling: { mode: "whole", number: Number(dieMatch[1]) },
        bonus: "",
      };
    }

    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "arcane-discharge",
        displayActivityName: true,
        magicDamage: true,
        magicEffect: true,
      }),
      ...midi,
      identifier: "arcane-discharge",
      displayActivityName: true,
      magicDamage: true,
      magicEffect: true,
    };
  }
}

function patchOffsetWard(item: FoundryItem, magical: boolean): boolean {
  const activities = activitiesOf(item);
  if (!activities) return false;

  let found = false;
  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (id !== "offset-ward" && !name.includes("offset ward")) continue;

    found = true;
    activity.name = "Offset Ward";
    activity.type = "utility";
    activity.img = "icons/magic/defensive/barrier-shield-dome-blue-purple.webp";
    activity.activation = {
      type: "reaction",
      value: 1,
      condition: "When you are hit by a melee attack",
      override: false,
    };
    // Spend is applied in Item Macro (Midi unpaid-reaction pattern).
    activity.consumption = {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    };
    activity.description = {
      chatFlavor:
        "+5 AC vs the triggering melee attack (Midi rechecks). Expends 2 Spell Counters via Item Macro. If this causes a miss, cast a Cantrip spell-attack at the attacker as part of the same Reaction.",
    };
    activity.range = {
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
    activity.roll = {
      formula: "",
      name: "",
      prompt: false,
      visible: false,
    };
    activity.useConditionText = "";
    activity.useConditionReason = "";
    activity.effectConditionText = "";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "offset-ward",
        displayActivityName: true,
        magicEffect: magical,
        magicDamage: magical,
      }),
      ...midi,
      identifier: "offset-ward",
      displayActivityName: true,
    };
  }
  return found;
}

function patchImproveCastingEffect(item: FoundryItem): void {
  for (const effect of item.effects) {
    if (!/^improve casting/i.test(effect.name ?? "")) continue;
    effect.img = "icons/magic/symbols/runes-star-magenta.webp";
  }
}

/**
 * Magus Staff overlay:
 * - All rarities: focus property, Attack name, Sap Item Macro on hit.
 * - Uncommon+: Harvest Magic recover dialog, Arcane Discharge scaled to gauge.
 * - Rare+: Offset Ward +5 AC reaction (Item Macro spend + isAttacked AE).
 */
export function applyMagusStaffOverlay(
  item: FoundryItem,
  weapon: CustomWeapon,
  _rarityIndex?: number,
): boolean {
  if (!isMagusStaff(item, weapon)) return false;

  const activities = activitiesOf(item);
  if (!activities) return false;

  ensureFocusProperty(item, weapon);
  patchDefaultAttackName(item);

  const system = item.system as Record<string, unknown>;
  const tier = resolveMagusStaffTier(item);
  const maxCounters = spellCoreMax(item);
  const hasGauge = maxCounters > 0;

  const magical =
    Number((system.magicalBonus as number | null | undefined) ?? 0) > 0 ||
    (Array.isArray(system.properties) &&
      (system.properties as string[]).includes("mgc"));

  let hasOffsetWard = false;
  if (hasGauge) {
    patchHarvestMagic(item);
    patchArcaneDischarge(item, tier);
    hasOffsetWard = patchOffsetWard(item, magical);
    patchImproveCastingEffect(item);
  }

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingMs =
    (existingWorld.magusStaff as Record<string, unknown> | undefined) ?? {};

  const passes = hasOffsetWard
    ? (["preTargeting", "postActiveEffects"] as const)
    : (["postActiveEffects"] as const);

  embedItemMacro(item, {
    command: MAGUS_STAFF_ITEM_MACRO,
    passes,
  });

  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      magusStaff: {
        ...existingMs,
        isMagusStaff: true,
        tier,
        spellCoreMax: hasGauge ? maxCounters : 0,
      },
    },
  };

  return true;
}
