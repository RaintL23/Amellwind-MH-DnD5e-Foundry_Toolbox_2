import {
  WeaponRarityRow,
  isUnlockListColumn,
  isWeaponFeatureColumn,
} from "@/shared/types";
import {
  getAccumulatedUnlocks,
  getUnlockColumnLabels,
} from "@/shared/foundry/weapons";

const TYPED_BONUS_COLUMNS: Array<{
  keys: string[];
  format: (value: string) => string;
}> = [
  { keys: ["bonus to hit", "bonus"], format: (value) => `${value} to hit` },
  { keys: ["bonus to damage"], format: (value) => `${value} damage` },
  { keys: ["bonus ac"], format: (value) => `${value} AC` },
];

const HEADER_BONUS_LABEL_KEYS = new Set(
  TYPED_BONUS_COLUMNS.flatMap((col) => col.keys),
);

function readColumnDisplay(val: string | string[] | undefined): string {
  if (val == null) return "";
  return Array.isArray(val) ? val.join(", ") : String(val);
}

function isEmptyBonusValue(value: string): boolean {
  const trimmed = value.trim();
  return !trimmed || trimmed === "--" || trimmed === "-";
}

/** Raw Bonus to Hit cell value (e.g. "+3"), for combat math. */
export function getRarityToHitBonus(row: WeaponRarityRow): string | undefined {
  for (const [label, val] of Object.entries(row.columns)) {
    const lower = label.toLowerCase();
    if (lower !== "bonus to hit" && lower !== "bonus") continue;
    const display = readColumnDisplay(val);
    if (isEmptyBonusValue(display)) continue;
    return display.trim();
  }
  return undefined;
}

export function getRaritySlideStatEntries(row: WeaponRarityRow): {
  headerBonuses: string[];
  otherStats: [string, string][];
} {
  const statEntries: [string, string][] = [];
  for (const [label, val] of Object.entries(row.columns)) {
    if (isWeaponFeatureColumn(label) || isUnlockListColumn(label)) continue;
    const display = readColumnDisplay(val);
    if (display) statEntries.push([label, display]);
  }

  const headerBonuses: string[] = [];
  for (const { keys, format } of TYPED_BONUS_COLUMNS) {
    const entry = statEntries.find(([label]) =>
      keys.includes(label.toLowerCase()),
    );
    if (!entry || isEmptyBonusValue(entry[1])) continue;
    headerBonuses.push(format(entry[1].trim()));
  }

  const otherStats = statEntries.filter(
    ([label]) => !HEADER_BONUS_LABEL_KEYS.has(label.toLowerCase()),
  );

  return {
    headerBonuses,
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
