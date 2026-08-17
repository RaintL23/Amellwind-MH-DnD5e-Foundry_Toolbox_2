import type { FoundryItem } from "@/shared/foundry";
import {
  defaultMidiProperties,
  embedItemMacro,
  foundryIdFromSeed,
} from "@/shared/foundry";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { LONGSWORD_ITEM_MACRO } from "./longsword.macro";

function activitiesOf(
  item: FoundryItem,
): Record<string, Record<string, unknown>> | undefined {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return undefined;
  return activities as Record<string, Record<string, unknown>>;
}

function isLongsword(item: FoundryItem, weapon: CustomWeapon): boolean {
  return (
    /^longsword$/i.test(weapon.name.trim()) ||
    /^longsword\b/i.test(item.name ?? "")
  );
}

function readColumnValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  if (value == null) return "";
  return String(value).trim();
}

function spiritGainAt(weapon: CustomWeapon, rarityIndex: number): number {
  const end = Math.min(rarityIndex, Math.max(0, weapon.rarityRows.length - 1));
  for (let i = end; i >= 0; i--) {
    const raw = readColumnValue(weapon.rarityRows[i]?.columns?.["Spirit Gain"]);
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 1;
}

function resolveLongswordTier(item: FoundryItem): string {
  const system = item.system as Record<string, unknown>;
  const rarity = String(system.rarity ?? "uncommon")
    .toLowerCase()
    .replace(/\s+/g, "");
  if (rarity === "veryrare") return "veryRare";
  return rarity || "uncommon";
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
  if (name.includes("spirit") || name.includes("foresight")) return false;
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

function patchSpiritBladeRider(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (!id.includes("spirit-blade") && !name.includes("spirit blade")) {
      continue;
    }
    activity.name = "Spirit Blade";
    activity.type = "damage";
    activity.activation = {
      type: "special",
      value: null,
      condition: "When you hit with a normal attack using this weapon",
      override: false,
    };
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      identifier: "spirit-blade",
      displayActivityName: true,
    };
  }
}

function patchForesightSlash(item: FoundryItem, magical: boolean): Record<
  string,
  unknown
> | undefined {
  const activities = activitiesOf(item);
  if (!activities) return undefined;

  let foresight: Record<string, unknown> | undefined;
  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (name.includes("counter")) continue;
    if (id !== "foresight-slash" && !name.includes("foresight")) continue;

    activity.name = "Foresight Slash";
    activity.type = "utility";
    activity.activation = {
      type: "reaction",
      value: 1,
      condition: "When a creature you can see hits you with a melee attack",
      override: false,
    };
    activity.consumption = {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    };
    activity.description = {
      chatFlavor:
        "+1d8 AC vs the triggering melee attack (Midi rechecks). Expends 2 spirit via Item Macro. On a miss, regain 1 spirit and use Foresight Slash: Counter.",
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
    activity.img = "icons/skills/melee/strike-sword-steel-yellow.webp";
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...defaultMidiProperties({
        identifier: "foresight-slash",
        displayActivityName: true,
        magicEffect: magical,
        magicDamage: magical,
      }),
      ...midi,
      identifier: "foresight-slash",
      displayActivityName: true,
    };
    foresight = activity;
  }
  return foresight;
}

function emitForesightCounter(
  item: FoundryItem,
  foresight: Record<string, unknown>,
  magical: boolean,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const [id, activity] of Object.entries(activities)) {
    if (/foresight slash:\s*counter/i.test(String(activity?.name ?? ""))) {
      delete activities[id];
    }
  }

  const attack = Object.values(activities).find(
    (activity) => activity && isDefaultAttack(activity),
  );
  const counterId = foundryIdFromSeed("act-longsword-foresight-counter");
  const cloned = attack
    ? (structuredClone(attack) as Record<string, unknown>)
    : {};

  cloned._id = counterId;
  cloned.type = "attack";
  cloned.sort = Number(foresight.sort ?? 0) + 500;
  cloned.name = "Foresight Slash: Counter";
  cloned.img = "icons/skills/melee/strike-sword-steel-yellow.webp";
  cloned.activation = {
    type: "special",
    value: null,
    condition: "If Foresight Slash causes the triggering melee attack to miss",
    override: false,
  };
  cloned.consumption = {
    scaling: { allowed: false, max: "" },
    spellSlot: false,
    targets: [],
  };
  cloned.description = {
    chatFlavor:
      "Make one Longsword attack against the attacker as part of the same Reaction (does not spend another Reaction).",
  };
  cloned.range = { units: "self", special: "", override: false };
  cloned.useConditionText = "";
  cloned.useConditionReason = "";
  cloned.effectConditionText = "false";
  cloned.midiProperties = defaultMidiProperties({
    identifier: "foresight-slash-counter",
    displayActivityName: true,
    magicDamage: magical,
    magicEffect: magical,
  });

  activities[counterId] = cloned;
}

/**
 * Longsword: Spirit Gauge fill on a normal Attack hit, Spirit Blade as an
 * on-hit damage rider, Foresight Slash AC AE + Counter (Rare+).
 */
export function applyLongswordOverlay(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
): boolean {
  if (!isLongsword(item, weapon)) return false;

  const system = item.system as Record<string, unknown>;
  const activities = activitiesOf(item);
  if (!activities) return false;

  const hasGauge = Object.values(activities).some((activity) => {
    const { name, id } = activityMeta(activity);
    return (
      id.includes("spirit-blade") ||
      name.includes("spirit blade") ||
      id.includes("foresight") ||
      name.includes("foresight")
    );
  });
  const uses = system.uses as { max?: unknown } | undefined;
  const hasUses =
    Number.parseInt(String(uses?.max ?? ""), 10) > 0 || hasGauge;
  if (!hasUses) return false;

  const magical =
    Number((system.magicalBonus as number | null | undefined) ?? 0) > 0 ||
    (Array.isArray(system.properties) &&
      (system.properties as string[]).includes("mgc"));

  patchDefaultAttackName(item);
  patchSpiritBladeRider(item);
  const foresight = patchForesightSlash(item, magical);
  if (foresight) emitForesightCounter(item, foresight, magical);

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  const existingLs =
    (existingWorld.longsword as Record<string, unknown> | undefined) ?? {};

  embedItemMacro(item, {
    command: LONGSWORD_ITEM_MACRO,
    passes: ["preTargeting", "postActiveEffects"],
  });

  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      longsword: {
        ...existingLs,
        isLongsword: true,
        tier: resolveLongswordTier(item),
        spiritGain: spiritGainAt(weapon, rarityIndex),
      },
    },
  };

  return true;
}
