import type { CartEntry, EquippedWeapon } from "@/shared/types";
import { parseCostGp } from "@/features/shops/utils/cost.utils";
import { hasActiveIntegratedShield } from "@/features/weapons/utils/shield.utils";

export function isGoldInventoryEntry(entry: CartEntry): boolean {
  const name = entry.name.trim();
  if (/^\d+(?:\.\d+)?\s*gp$/i.test(name)) return true;
  return (
    /\bgp\b/i.test(name) &&
    parseCostGp(entry.cost ?? "") > 0 &&
    !entry.linkedWeaponName
  );
}

export function getGoldFromInventoryEntry(entry: CartEntry): number {
  const fromCost = parseCostGp(entry.cost ?? "");
  if (fromCost > 0) return fromCost * entry.quantity;

  const nameMatch = entry.name.trim().match(/^(\d+(?:\.\d+)?)\s*gp$/i);
  if (nameMatch) return parseFloat(nameMatch[1]) * entry.quantity;

  return 0;
}

export function sumInventoryGoldGp(items: CartEntry[]): number {
  return items.reduce((sum, entry) => {
    if (!isGoldInventoryEntry(entry)) return sum;
    return sum + getGoldFromInventoryEntry(entry);
  }, 0);
}

export function formatGoldPiecesForPdf(gp: number): string | undefined {
  if (gp <= 0) return undefined;
  return gp % 1 === 0 ? String(gp) : gp.toFixed(2);
}

export function buildEquipmentExport(options: {
  items: CartEntry[];
  mainHandName?: string | null;
  offHandName?: string | null;
  armorName?: string | null;
  shieldName?: string | null;
  trinket1Name?: string | null;
  trinket2Name?: string | null;
}): string {
  const {
    items,
    mainHandName,
    offHandName,
    armorName,
    shieldName,
    trinket1Name,
    trinket2Name,
  } = options;

  const lines: string[] = [];
  const seen = new Set<string>();

  function pushLine(line: string) {
    const key = line.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(line);
  }

  if (mainHandName) pushLine(`${mainHandName} (main hand)`);
  if (offHandName) pushLine(`${offHandName} (off hand)`);
  if (armorName) pushLine(`${armorName} (armor)`);
  if (shieldName) pushLine(`${shieldName} (shield)`);
  if (trinket1Name) pushLine(`${trinket1Name} (trinket)`);
  if (trinket2Name) pushLine(`${trinket2Name} (trinket)`);

  const equippedNames = new Set(
    [mainHandName, offHandName, armorName, shieldName, trinket1Name, trinket2Name]
      .filter(Boolean)
      .map((name) => name!.toLowerCase()),
  );

  for (const entry of items) {
    if (equippedNames.has(entry.name.toLowerCase())) continue;
    if (isGoldInventoryEntry(entry)) continue;
    const label =
      entry.quantity > 1 ? `${entry.name} ×${entry.quantity}` : entry.name;
    pushLine(label);
  }

  return lines.join("\n");
}

export function hasShieldEquipped(options: {
  equippedShield: { name: string } | null;
  mainHand: EquippedWeapon | null;
}): boolean {
  if (options.equippedShield) return true;
  return hasActiveIntegratedShield(options.mainHand);
}
