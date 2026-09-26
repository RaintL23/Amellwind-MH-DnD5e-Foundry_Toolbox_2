import { getAbilityModifier } from "@/shared/utils/cr.utils";
import type {
  PlayCharacterCompiled,
  PlayInventoryItem,
  PlaySessionState,
} from "./play-character.types";

function looksLikeClothing(item: PlayInventoryItem): boolean {
  if (/clothing|clothes|common clothes|traveler's clothes|robe|outfit/i.test(item.name)) {
    return true;
  }
  return item.kind === "gear" && item.armorAc == null;
}

function isEquippedArmor(item: PlayInventoryItem): boolean {
  return (
    item.equipped &&
    item.quantity > 0 &&
    item.kind === "armor" &&
    item.armorAc != null &&
    !looksLikeClothing(item)
  );
}

function isEquippedShield(item: PlayInventoryItem): boolean {
  return (
    item.equipped &&
    item.quantity > 0 &&
    (item.kind === "shield" ||
      (item.shieldBonus != null && item.kind !== "armor"))
  );
}

/**
 * Session AC from equipped armor/shield + DEX + acAdjust.
 * `compiled.armorClass` is shield-free (unarmored floor or worn armor base
 * from compile, including Unarmored Defense when modeled there).
 */
export function getEffectiveArmorClass(
  compiled: PlayCharacterCompiled,
  session: PlaySessionState,
): number {
  const dexMod = getAbilityModifier(compiled.abilityScores.dex);
  const armor = session.inventory.find(isEquippedArmor);
  const shield = session.inventory.find(isEquippedShield);

  let base: number;
  if (armor && armor.armorAc != null) {
    const maxDex = armor.armorMaxDex;
    const dexPart =
      maxDex === null || maxDex === undefined
        ? dexMod
        : Math.min(dexMod, maxDex);
    base = armor.armorAc + dexPart;
  } else {
    // Do not max with 10+DEX — compile already baked unarmored/UD into armorClass.
    base = compiled.armorClass;
  }

  const shieldPart = shield
    ? (shield.shieldBonus ?? (shield.kind === "shield" ? 2 : 0))
    : 0;

  return base + shieldPart + (session.acAdjust || 0);
}

/** When equipping armor or shield, unequip other items of the same exclusive kind. */
export function applyEquipExclusivity(
  inventory: PlayInventoryItem[],
  itemId: string,
  equipped: boolean,
): PlayInventoryItem[] {
  const target = inventory.find((i) => i.id === itemId);
  if (!target) return inventory;

  const exclusiveKind =
    target.kind === "armor"
      ? "armor"
      : target.kind === "shield" || target.shieldBonus != null
        ? "shield"
        : null;

  return inventory.map((item) => {
    if (item.id === itemId) {
      return { ...item, equipped };
    }
    if (!equipped || !exclusiveKind) return item;
    if (exclusiveKind === "armor" && item.kind === "armor") {
      return { ...item, equipped: false };
    }
    if (
      exclusiveKind === "shield" &&
      (item.kind === "shield" || item.shieldBonus != null)
    ) {
      return { ...item, equipped: false };
    }
    return item;
  });
}
