import {
  WeaponRarityRow,
  isUnlockListColumn,
  isWeaponFeatureColumn,
} from "@/shared/types";
import {
  getAccumulatedUnlocks,
  getUnlockColumnLabels,
} from "./weapon-feature-chains.utils";

export function getRaritySlideStatEntries(
  row: WeaponRarityRow,
): { bonus?: string; otherStats: [string, string][] } {
  const statEntries: [string, string][] = [];
  for (const [label, val] of Object.entries(row.columns)) {
    if (isWeaponFeatureColumn(label) || isUnlockListColumn(label)) continue;
    const display = Array.isArray(val) ? val.join(", ") : val;
    if (display) statEntries.push([label, display]);
  }

  const bonusEntry = statEntries.find(([k]) => k.toLowerCase() === "bonus");
  const otherStats = statEntries.filter(([k]) => k.toLowerCase() !== "bonus");

  return {
    bonus: bonusEntry?.[1],
    otherStats,
  };
}

export function getRaritySlideUnlockSections(
  rarityRows: WeaponRarityRow[],
  rarityIndex: number,
) {
  return getUnlockColumnLabels(rarityRows)
    .map((label) => ({
      label,
      items: getAccumulatedUnlocks(rarityRows, label, rarityIndex),
    }))
    .filter((s) => s.items.length > 0);
}
