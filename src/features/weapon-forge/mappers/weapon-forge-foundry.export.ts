import type { Weapon } from "@/shared/types";
import { isBaseRarity } from "@/shared/types";
import type { FoundryItem } from "@/shared/foundry";
import {
  buildFoundryItemFilename,
  formatWeaponFoundryItemName,
} from "@/shared/foundry";
import { makeWeaponSlot } from "@/features/builder/utils/equipment.factory";
import { buildWeaponItem } from "@/features/builder/foundry-export/item.builders";
import {
  applyItemAutomation,
  compileWeaponFeatureActivities,
  enrichWeaponActivities,
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
import {
  applyDualBladesDemonDodgeOverlay,
  applyHuntingHornSongbookOverlay,
  defaultWeaponForgeItemFlags,
} from "./weapon-forge-foundry-envelope";
import { buildWeaponMelodyFeatItems } from "./weapon-forge-melody.export";

/** Foundry feat group for a weapon-resource column that already has export builders. */
export interface WeaponFoundryResourceGroup {
  /** Stable tab id (e.g. `melodies`). */
  id: string;
  /** UI label (e.g. `Melodies`). */
  label: string;
  items: FoundryItem[];
}

export interface WeaponFoundryExportBundle {
  weapon: FoundryItem;
  /** Flat list of resource feats (download order). */
  resources: FoundryItem[];
  /**
   * Resource feats grouped for Foundry preview tabs.
   * Only columns with a real Foundry builder appear (today: Melodies).
   */
  resourceGroups: WeaponFoundryResourceGroup[];
}

/**
 * Build Foundry feat groups for weapon resources that have export builders.
 * Add Phials / Ammo / Coatings here when their feat builders land.
 */
export function buildWeaponFoundryResourceGroups(
  weapon: CustomWeapon,
  rarityIndex: number,
): WeaponFoundryResourceGroup[] {
  const groups: WeaponFoundryResourceGroup[] = [];
  const melodies = buildWeaponMelodyFeatItems(weapon, rarityIndex);
  if (melodies.length > 0) {
    groups.push({ id: "melodies", label: "Melodies", items: melodies });
  }
  return groups;
}

export function buildWeaponFoundryItem(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem {
  return buildWeaponFoundryExportBundle(weapon, rarityIndex).weapon;
}

export function buildWeaponFoundryExportBundle(
  weapon: CustomWeapon,
  rarityIndex: number,
): WeaponFoundryExportBundle {
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

  // Canonical forge display: "Great Sword (Rare)" — including Base; not Foundry's "+1 …".
  const exportName = formatWeaponFoundryItemName(weapon.name, rarityLabel);

  const exportWeapon: Weapon = {
    ...weapon,
    weaponCategory,
    baseName: weapon.name,
    itemRarityLabel: isBaseRarity(rarityLabel) ? undefined : rarityLabel,
    name: exportName,
  };

  const equipped = makeWeaponSlot(exportWeapon, rarityLabel);
  const item = buildWeaponItem(equipped, {
    equipped: false,
    description: buildFoundryDescriptionHtml(weapon, clamped),
    chatDescription: buildFoundryChatDescriptionHtml(weapon, clamped),
  });

  item.img = resolveWeaponImg(weapon);

  const system = item.system as Record<string, unknown>;
  // Keep rarety in display name, but Foundry identifier/baseItem stay on the weapon stem.
  const stem = weapon.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  if (stem) {
    system.identifier = stem;
    const type = system.type as Record<string, unknown> | undefined;
    if (type && typeof type === "object") {
      type.baseItem = stem;
    }
  }

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
  system.properties = [...props].sort((a, b) => a.localeCompare(b));

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

  enrichWeaponActivities(item);

  item.flags = {
    ...defaultWeaponForgeItemFlags({
      baseWeaponName: weapon.name,
    }),
    ...item.flags,
  };

  // Weapon-specific overlays own midi-qol / itemacro / world (applied last).
  applyHuntingHornSongbookOverlay(item);
  applyDualBladesDemonDodgeOverlay(item);

  const resourceGroups = buildWeaponFoundryResourceGroups(weapon, clamped);
  const resources = resourceGroups.flatMap((group) => group.items);

  return { weapon: item, resources, resourceGroups };
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
  return buildFoundryItemFilename(weapon.name, rarity);
}
