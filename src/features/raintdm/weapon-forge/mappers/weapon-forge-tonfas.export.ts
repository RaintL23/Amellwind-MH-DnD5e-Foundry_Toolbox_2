import type { FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  defaultMidiProperties,
  EFFECT_MODE,
  embedItemMacro,
  foundryIdFromSeed,
} from "@/shared/foundry";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";
import { wireTriggeredFromAttacks } from "@/shared/foundry/weapons/activity-emit";
import { TONFAS_ITEM_MACRO } from "./tonfas.macro";

function activitiesOf(
  item: FoundryItem,
): Record<string, Record<string, unknown>> | undefined {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return undefined;
  return activities as Record<string, Record<string, unknown>>;
}

function isTonfas(item: FoundryItem, weapon: CustomWeapon): boolean {
  return (
    /^tonfas?$/i.test(weapon.name.trim()) ||
    /^tonfas?\b/i.test(item.name ?? "")
  );
}

function hasFeature(
  weapon: CustomWeapon,
  rarityIndex: number,
  nameRe: RegExp,
): boolean {
  const end = Math.min(rarityIndex, Math.max(0, weapon.rarityRows.length - 1));
  for (let i = 0; i <= end; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
      if (nameRe.test(ref.name.trim())) return true;
    }
  }
  return false;
}

/** Tonfa Spirit Gauge capacity by unlocked upgrade leaves. */
export function resolveTonfaSpiritMax(
  weapon: CustomWeapon,
  rarityIndex: number,
): number {
  if (hasFeature(weapon, rarityIndex, /^spirit\s*gauge\s*upgrade\s*(iv|4)$/i)) {
    return 6;
  }
  if (hasFeature(weapon, rarityIndex, /^spirit\s*gauge\s*upgrade\s*(iii|3)$/i)) {
    return 5;
  }
  if (hasFeature(weapon, rarityIndex, /^spirit\s*gauge\s*upgrade\s*ii$/i)) {
    return 4;
  }
  if (hasFeature(weapon, rarityIndex, /^spirit\s*gauge\s*upgrade\s*i$/i)) {
    return 3;
  }
  return 2;
}

function resolveSpiritBurstDie(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  if (hasFeature(weapon, rarityIndex, /^spirit\s*burst\s*upgrade\s*(iii|3)$/i)) {
    return "1d10";
  }
  if (hasFeature(weapon, rarityIndex, /^spirit\s*burst\s*upgrade\s*ii$/i)) {
    return "1d8";
  }
  if (hasFeature(weapon, rarityIndex, /^spirit\s*burst\s*upgrade\s*i$/i)) {
    return "1d6";
  }
  return "1d4";
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

function patchSpiritGaugeUses(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
): void {
  const max = resolveTonfaSpiritMax(weapon, rarityIndex);
  const system = item.system as Record<string, unknown>;
  system.uses = {
    spent: max,
    recovery: [],
    max: String(max),
  };
}

function patchSpiritBurstActivities(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
  magical: boolean,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  const max = resolveTonfaSpiritMax(weapon, rarityIndex);
  const burstDie = resolveSpiritBurstDie(weapon, rarityIndex);

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (!id.includes("spirit-burst") && !name.includes("spirit burst")) {
      continue;
    }

    const consumption = activity.consumption as
      | { scaling?: { max?: string } }
      | undefined;
    if (consumption?.scaling) {
      consumption.scaling.max = String(max);
    }

    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ?? {};
    activity.midiProperties = {
      ...midi,
      magicEffect: magical,
      magicDamage: magical,
    };

    const activityId = String(activity._id ?? "");
    if (activityId) {
      wireTriggeredFromAttacks(item, activityId, "hits > 0");
    }
  }

  ensureSpiritBurstButtonsUpToMax(activities, max, burstDie, magical);
}

function parseDieDenomination(die: string): number {
  const match = /^1d(\d+)$/i.exec(die.trim());
  return match ? Number.parseInt(match[1] ?? "4", 10) : 4;
}

function ensureSpiritBurstButtonsUpToMax(
  activities: Record<string, Record<string, unknown>>,
  max: number,
  burstDie: string,
  magical: boolean,
): void {
  if (max <= 4) return;

  const template = Object.values(activities).find((activity) => {
    if (!activity) return false;
    const name = String(activity.name ?? "");
    return name === "Spirit Burst ×4" || name === "Spirit Burst ×1";
  });
  if (!template) return;

  const denomination = parseDieDenomination(burstDie);

  for (let n = 5; n <= max; n++) {
    const existing = Object.values(activities).some(
      (activity) => String(activity?.name ?? "") === `Spirit Burst ×${n}`,
    );
    if (existing) continue;

    const id = foundryIdFromSeed(`act-spirit-burst-${n}-tonfas`);
    const clone = structuredClone(template) as Record<string, unknown>;
    clone._id = id;
    clone.name = `Spirit Burst ×${n}`;
    clone.sort = 401000 + n * 1000;

    const consumption = clone.consumption as
      | {
          scaling?: { max?: string };
          targets?: { value?: string }[];
        }
      | undefined;
    if (consumption?.scaling) consumption.scaling.max = String(max);
    if (consumption?.targets?.[0]) consumption.targets[0].value = String(n);

    const midi =
      (clone.midiProperties as Record<string, unknown> | undefined) ?? {};
    clone.midiProperties = {
      ...midi,
      identifier: `spirit-burst-${n}`,
      magicEffect: magical,
      magicDamage: magical,
    };

    clone.description = {
      chatFlavor: `Expend ${n} Spirit Charges for +${n}d${denomination} Force damage on that hit. Consumes ${n} (+${n}d${denomination}).`,
    };

    const damage = clone.damage as
      | { parts?: { number?: number; denomination?: number }[] }
      | undefined;
    if (damage?.parts?.[0]) {
      damage.parts[0].number = n;
      damage.parts[0].denomination = denomination;
    }

    activities[id] = clone;
  }
}

function ensureStyleEffects(item: FoundryItem): {
  skyId: string;
  earthId: string;
} {
  const skyId = foundryIdFromSeed("tonfas-sky-style");
  const earthId = foundryIdFromSeed("tonfas-earth-style");

  const existingSky = item.effects.find((e) => e._id === skyId);
  const existingEarth = item.effects.find((e) => e._id === earthId);

  if (!existingSky) {
    const sky = buildEffect({
      name: "Sky Style",
      img: "icons/magic/air/wind-stream-blue-gray.webp",
      description:
        "Tonfa Sky Style: ignore difficult terrain; moving through a hostile creature's space does not cost extra movement.",
      transfer: false,
      disabled: true,
      changes: [],
      flags: {
        dae: { stackable: "noneName", showIcon: true },
      },
    });
    sky._id = skyId;
    item.effects.push(sky);
  }

  if (!existingEarth) {
    const earth = buildEffect({
      name: "Earth Style",
      img: "icons/magic/earth/strike-fist-stone-gray.webp",
      description:
        "Tonfa Earth Style: weapon damage die increases to 1d10; your walking speed is halved while in this stance.",
      transfer: false,
      disabled: true,
      changes: [
        {
          key: "system.attributes.movement.walk",
          mode: EFFECT_MODE.MULTIPLY,
          value: "0.5",
          priority: 20,
        },
      ],
      flags: {
        dae: { stackable: "noneName", showIcon: true },
      },
    });
    earth._id = earthId;
    item.effects.push(earth);
  }

  return { skyId, earthId };
}

function patchTonfaStylesActivity(
  item: FoundryItem,
  styleIds: { skyId: string; earthId: string },
  isStyleMaster = false,
): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (
      !id.includes("tonfa-styles") &&
      !name.includes("tonfa styles") &&
      !id.includes("style-master") &&
      !name.includes("style master")
    ) {
      continue;
    }

    if (name.includes("style master")) {
      activity.name = "Style Master";
    } else {
      activity.name = "Tonfa Styles";
    }
    activity.description = {
      chatFlavor: isStyleMaster
        ? "Toggle Sky Style ↔ Earth Style once per turn without a Bonus Action (Style Master); otherwise use Bonus Action."
        : "Toggle Sky Style ↔ Earth Style. Item Macro updates style indicators on the actor.",
    };
    activity.effects = [{ _id: styleIds.skyId }, { _id: styleIds.earthId }];
    activity.midiProperties = defaultMidiProperties({
      identifier: "tonfa-styles",
      displayActivityName: true,
    });
  }
}

function patchEarthImpactActivity(item: FoundryItem, magical: boolean): void {
  const activities = activitiesOf(item);
  if (!activities) return;

  for (const activity of Object.values(activities)) {
    if (!activity) continue;
    const { name, id } = activityMeta(activity);
    if (!id.includes("earth-impact") && !name.includes("earth impact")) {
      continue;
    }

    activity.name = "Earth Impact";
    activity.type = "save";
    activity.save = {
      ability: ["str"],
      dc: { calculation: "str", formula: "" },
    };
    activity.midiProperties = defaultMidiProperties({
      identifier: "earth-impact",
      displayActivityName: true,
      magicEffect: magical,
      magicDamage: magical,
    });
  }
}

function patchDefaultAttackName(item: FoundryItem): void {
  const activities = activitiesOf(item);
  if (!activities) return;
  for (const activity of Object.values(activities)) {
    if (!activity || activity.type !== "attack") continue;
    const { name, id } = activityMeta(activity);
    if (name.includes("spirit") || name.includes("earth")) continue;
    if (name === "" || name === "attack" || id === "attack") {
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
}

/**
 * Tonfas: Spirit Gauge capacity, Spirit Burst rider, Sky/Earth style toggle,
 * Sky Step / Earth Impact, and Item Macro fill-on-hit.
 */
export function applyTonfasOverlay(
  item: FoundryItem,
  weapon: CustomWeapon,
  rarityIndex: number,
): boolean {
  if (!isTonfas(item, weapon)) return false;

  const system = item.system as Record<string, unknown>;
  const magical =
    Number((system.magicalBonus as number | null | undefined) ?? 0) > 0 ||
    (Array.isArray(system.properties) &&
      (system.properties as string[]).includes("mgc"));

  patchSpiritGaugeUses(item, weapon, rarityIndex);
  patchDefaultAttackName(item);

  patchSpiritBurstActivities(item, weapon, rarityIndex, magical);

  const styleIds = ensureStyleEffects(item);
  patchTonfaStylesActivity(
    item,
    styleIds,
    hasFeature(weapon, rarityIndex, /^style\s*master$/i),
  );
  patchEarthImpactActivity(item, magical);

  const spiritMax = resolveTonfaSpiritMax(weapon, rarityIndex);
  const burstDie = resolveSpiritBurstDie(weapon, rarityIndex);

  embedItemMacro(item, {
    command: TONFAS_ITEM_MACRO,
    passes: ["preTargeting", "postActiveEffects"],
  });

  const existingWorld =
    (item.flags?.world as Record<string, unknown> | undefined) ?? {};
  item.flags = {
    ...item.flags,
    world: {
      ...existingWorld,
      tonfas: {
        isTonfas: true,
        spiritMax,
        burstDie,
        hasEarthImpact: hasFeature(weapon, rarityIndex, /^earth\s*impact$/i),
        hasSkyStep: hasFeature(weapon, rarityIndex, /^sky\s*step$/i),
        hasFastSpiritCharge: hasFeature(
          weapon,
          rarityIndex,
          /^fast\s*spirit\s*charge$/i,
        ),
        hasSkyDash: hasFeature(weapon, rarityIndex, /^sky\s*dash$/i),
        hasStyleMaster: hasFeature(weapon, rarityIndex, /^style\s*master$/i),
        hasApexSpirit: hasFeature(weapon, rarityIndex, /^apex\s*spirit$/i),
      },
    },
  };

  return true;
}
