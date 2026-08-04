import type { Weapon } from "@/shared/types";
import { isBaseRarity } from "@/shared/types";
import type { FoundryItem } from "@/shared/foundry";
import { makeWeaponSlot } from "@/features/builder/utils/equipment.factory";
import { buildWeaponItem } from "@/features/builder/foundry-export/item.builders";
import {
  applyItemAutomation,
  compileWeaponFeatureActivities,
} from "@/shared/foundry/weapons";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { resolveMagicalBonus } from "./weapon-forge-foundry.helpers";
import {
  buildFoundryDescriptionHtml,
  buildFoundryChatDescriptionHtml,
  buildRarityPassiveEffects,
  resolveWeaponImg,
} from "./weapon-forge-description.export";
import {
  applySwitchModeActivities,
  applyMidiToExistingActivities,
} from "./weapon-forge-activities.export";
import { hasWeaponSwitchModes } from "@/features/weapons/utils/weapon-mode.utils";

export function buildWeaponFoundryItem(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem {
  const clamped = Math.max(
    0,
    Math.min(rarityIndex, Math.max(0, weapon.rarityRows.length - 1)),
  );
  const row = weapon.rarityRows[clamped];
  const rarityLabel = row?.rarity ?? "Common";
  const magicalBonus = resolveMagicalBonus(weapon, clamped);

  const weaponCategory: Weapon["weaponCategory"] =
    weapon.proficiency?.tier === "simple"
      ? "simple"
      : weapon.proficiency?.tier === "martial" ||
          weapon.proficiency?.tier === "martial-or-simple"
        ? "martial"
        : "martial";

  const exportWeapon: Weapon = {
    ...weapon,
    weaponCategory,
    baseName: weapon.name,
    itemRarityLabel: isBaseRarity(rarityLabel) ? undefined : rarityLabel,
    name:
      magicalBonus > 0 && !/^\+\d+\s/.test(weapon.name)
        ? `+${magicalBonus} ${weapon.name}`
        : weapon.name,
  };

  const equipped = makeWeaponSlot(exportWeapon, rarityLabel);
  const item = buildWeaponItem(equipped, {
    equipped: false,
    description: buildFoundryDescriptionHtml(weapon, clamped),
    chatDescription: buildFoundryChatDescriptionHtml(weapon, clamped),
  });

  item.img = resolveWeaponImg(weapon);

  const system = item.system as Record<string, unknown>;
  let magical = magicalBonus > 0;

  if (row && !isBaseRarity(row.rarity)) {
    system.rarity = mapRarityLabel(row.rarity);
    if (magicalBonus > 0) {
      system.magicalBonus = magicalBonus;
      const props = Array.isArray(system.properties)
        ? [...(system.properties as string[])]
        : [];
      if (!props.includes("mgc")) props.push("mgc");
      system.properties = props;
      magical = true;
    }
  }

  const props = Array.isArray(system.properties)
    ? (system.properties as string[])
    : [];
  if (props.includes("mgc")) magical = true;

  const multiMode = hasWeaponSwitchModes(weapon);
  if (multiMode) {
    applySwitchModeActivities(item, weapon, magical);
  } else {
    applyMidiToExistingActivities(item, { magical, multiMode: false });
  }

  // Chain-first combat features: 1 chain → 1 Activity merged at this rarity.
  compileWeaponFeatureActivities(item, weapon, clamped, { magical });

  applyItemAutomation(item);

  const passiveEffects = buildRarityPassiveEffects(weapon, clamped);
  if (passiveEffects.length > 0) {
    item.effects.push(...passiveEffects);
  }

  // Canonical English name helps Automated Animations / CPR name matching.
  item.flags = {
    ...item.flags,
    "amellwind-toolbox": {
      ...(typeof item.flags["amellwind-toolbox"] === "object" &&
      item.flags["amellwind-toolbox"] !== null
        ? (item.flags["amellwind-toolbox"] as Record<string, unknown>)
        : {}),
      baseWeaponName: weapon.name,
      exportKind: "weapon-forge",
    },
  };

  return item;
}

function mapRarityLabel(label: string): string {
  switch (label.trim().toLowerCase()) {
    case "common":
      return "common";
    case "uncommon":
      return "uncommon";
    case "rare":
      return "rare";
    case "very rare":
      return "veryRare";
    case "legendary":
      return "legendary";
    default:
      return "";
  }
}

export function foundryItemFilename(
  weapon: CustomWeapon,
  rarityIndex: number,
): string {
  const rarity = weapon.rarityRows[rarityIndex]?.rarity ?? "item";
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `fvtt-Item-${slug(weapon.name) || "weapon"}-${slug(rarity) || "item"}.json`;
}

