import {
  WeaponRarityRow,
  isUnlockListColumn,
  isWeaponFeatureColumn,
} from "@/shared/types";
import {
  getAccumulatedUnlocks,
  getUnlockColumnLabels,
  type ColumnChains,
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

/** Die faces / formulas used as rarity-scaling damage columns (e.g. d4 → d6). */
const DIE_FACE_RE = /^(?:\d+)?d\d+$/i;

function readColumnDisplay(val: string | string[] | undefined): string {
  if (val == null) return "";
  return Array.isArray(val) ? val.join(", ") : String(val);
}

function isEmptyBonusValue(value: string): boolean {
  const trimmed = value.trim();
  return !trimmed || trimmed === "--" || trimmed === "-";
}

export function isDieFaceToken(value: string): boolean {
  return DIE_FACE_RE.test(value.trim());
}

/**
 * Scaling damage-die columns (e.g. "Burst Slash Dice": d4 → d6 → d8).
 * These are combat bonuses that grow with rarity, not named features.
 */
export function isScalingDiceColumn(col: ColumnChains): boolean {
  if (/\bdice\b/i.test(col.label)) return true;
  const names = col.chains.flatMap((chain) =>
    chain.features.map((feat) => feat.name),
  );
  return names.length > 0 && names.every(isDieFaceToken);
}

export function partitionRaritySlideColumnChains(columnChains: ColumnChains[]): {
  scalingDiceColumns: ColumnChains[];
  featureColumns: ColumnChains[];
} {
  const scalingDiceColumns: ColumnChains[] = [];
  const featureColumns: ColumnChains[] = [];
  for (const col of columnChains) {
    if (isScalingDiceColumn(col)) scalingDiceColumns.push(col);
    else featureColumns.push(col);
  }
  return { scalingDiceColumns, featureColumns };
}

export function hasVisibleColumnChainsAtRarity(
  columns: ColumnChains[],
  rarityIndex: number,
  baseFeatureNameKeys: Set<string> = new Set(),
): boolean {
  return columns.some((col) =>
    col.chains.some(
      (chain) =>
        chain.introducedAtIndex <= rarityIndex &&
        chain.features.some(
          (feat) =>
            feat.rarityIndex <= rarityIndex &&
            !baseFeatureNameKeys.has(feat.name.toLowerCase()),
        ),
    ),
  );
}

/** Latest die introduced at or before this rarity (e.g. Rare → "d6"). */
export function getCurrentScalingDie(
  col: ColumnChains,
  rarityIndex: number,
): string | undefined {
  let latest: string | undefined;
  let latestIndex = -1;
  for (const chain of col.chains) {
    for (const feat of chain.features) {
      if (feat.rarityIndex > rarityIndex || feat.rarityIndex < latestIndex) {
        continue;
      }
      latestIndex = feat.rarityIndex;
      latest = feat.name.trim();
    }
  }
  return latest || undefined;
}

/** Header chips like "d6 Burst Slash", grouped with +hit / +AC. */
export function getScalingDiceHeaderBonuses(
  columns: ColumnChains[],
  rarityIndex: number,
): string[] {
  const bonuses: string[] = [];
  for (const col of columns) {
    const die = getCurrentScalingDie(col, rarityIndex);
    if (!die) continue;
    const baseLabel = col.label.replace(/\s*dice\s*$/i, "").trim();
    bonuses.push(baseLabel ? `${die} ${baseLabel}` : die);
  }
  return bonuses;
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
