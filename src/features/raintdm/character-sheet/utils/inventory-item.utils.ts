import type { PlayInventoryItem } from "./play-character.types";

function itemTextBlob(item: PlayInventoryItem): string {
  return `${item.name} ${item.summary ?? ""} ${item.notes ?? ""}`;
}

/** Weapons, armor, and shields can be equipped for attacks / AC. */
export function isEquippableInventoryItem(item: PlayInventoryItem): boolean {
  if (item.isWeapon) return true;
  if (item.kind === "weapon" || item.kind === "armor" || item.kind === "shield") {
    return true;
  }
  if (item.armorAc != null || item.shieldBonus != null) return true;
  return false;
}

export function isPotionItem(item: PlayInventoryItem): boolean {
  return /potion|pocion|poción/i.test(itemTextBlob(item));
}

/** Consumables the player can activate from inventory (potions, scrolls, …). */
export function isUsableInventoryItem(item: PlayInventoryItem): boolean {
  if (isEquippableInventoryItem(item)) return false;
  const blob = itemTextBlob(item);
  return (
    isPotionItem(item) ||
    /scroll|pergamino|elixir|antitoxin|philter|\boil\b/i.test(blob)
  );
}

/** Healing dice for common Potion of Healing variants; null if not a heal potion. */
export function healingExpressionFromPotionName(name: string): string | null {
  const n = name.toLowerCase();
  if (!/potion|pocion|poción/i.test(n)) return null;
  if (!/heal|curaci|vida|life/i.test(n)) return null;
  if (/supreme|suprema/.test(n)) return "10d4+20";
  if (/superior/.test(n)) return "8d4+8";
  if (/greater|mayor/.test(n)) return "4d4+4";
  return "2d4+2";
}
