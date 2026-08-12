import {
  WeaponRarityRow,
  isUnlockListColumn,
  isWeaponAcBonusColumn,
  isWeaponFeatureColumn,
} from "@/shared/types";
import {
  getAccumulatedUnlocks,
  getUnlockColumnLabels,
  type ColumnChains,
} from "@/shared/foundry/weapons";

const SIMPLE_BONUS_VALUE_RE = /^[+-]\d+$/;

type TypedBonusKind = "toHit" | "damage" | "ac";

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

function isSimpleBonusDisplay(value: string): boolean {
  return SIMPLE_BONUS_VALUE_RE.test(value.trim());
}

function typedBonusKind(label: string): TypedBonusKind | undefined {
  const lower = label.toLowerCase().trim();
  if (lower === "bonus to hit" || lower === "bonus") return "toHit";
  if (lower === "bonus to damage") return "damage";
  if (isWeaponAcBonusColumn(label)) return "ac";
  return undefined;
}

function formatGenericSimpleBonus(label: string, value: string): string {
  const nice = label
    .replace(/^bonus\s+/i, "")
    .replace(/\s+bonus$/i, "")
    .trim();
  return nice ? `${value} ${nice}` : value;
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

  let toHit: string | undefined;
  let damage: string | undefined;
  let ac: string | undefined;
  const genericHeader: string[] = [];
  const otherStats: [string, string][] = [];

  for (const [label, raw] of statEntries) {
    const value = raw.trim();
    if (isEmptyBonusValue(value)) continue;

    const kind = typedBonusKind(label);
    if (kind === "toHit") {
      toHit = value;
      continue;
    }
    if (kind === "damage") {
      damage = value;
      continue;
    }
    if (kind === "ac") {
      ac = value;
      continue;
    }
    if (isSimpleBonusDisplay(value)) {
      genericHeader.push(formatGenericSimpleBonus(label, value));
      continue;
    }
    otherStats.push([label, raw]);
  }

  const headerBonuses: string[] = [];
  if (toHit) {
    const damageMatchesHit = !damage || damage === toHit;
    headerBonuses.push(
      damageMatchesHit ? `${toHit} to Hit and Damage` : `${toHit} to Hit`,
    );
  }
  if (damage && damage !== toHit) {
    headerBonuses.push(`${damage} to Damage`);
  }
  if (ac) {
    headerBonuses.push(`${ac} to AC`);
  }
  headerBonuses.push(...genericHeader);

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
