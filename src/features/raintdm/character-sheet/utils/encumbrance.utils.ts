import type {
  PlayCharacterCompiled,
  PlayCurrency,
  PlayInventoryItem,
  PlaySessionState,
} from "./play-character.types";

export type EncumbranceTier = "normal" | "encumbered" | "heavily" | "over";

export interface EncumbranceResult {
  totalLb: number;
  capacityLb: number;
  tier: EncumbranceTier;
  /** Variant: Str×5 / Str×10 thresholds */
  encumberedAt?: number;
  heavilyAt?: number;
}

function coinCount(c: PlayCurrency): number {
  return c.pp + c.gp + c.ep + c.sp + c.cp;
}

export function sumInventoryWeightLb(
  items: PlayInventoryItem[],
  currency: PlayCurrency,
  countCoinWeight: boolean,
): number {
  const itemWeight = items.reduce(
    (sum, it) => sum + it.weightLb * Math.max(0, it.quantity),
    0,
  );
  const coins = countCoinWeight ? coinCount(currency) / 50 : 0;
  return Math.round((itemWeight + coins) * 100) / 100;
}

export function getEncumbrance(
  compiled: PlayCharacterCompiled,
  session: PlaySessionState,
): EncumbranceResult {
  const str = compiled.abilityScores.str;
  const capacityLb = compiled.carryingCapacityLb || str * 15;
  const totalLb = sumInventoryWeightLb(
    session.inventory,
    session.currency,
    session.countCoinWeight,
  );

  if (!session.useVariantEncumbrance) {
    let tier: EncumbranceTier = "normal";
    if (totalLb > capacityLb) tier = "over";
    return { totalLb, capacityLb, tier };
  }

  const encumberedAt = str * 5;
  const heavilyAt = str * 10;
  let tier: EncumbranceTier = "normal";
  if (totalLb > capacityLb) tier = "over";
  else if (totalLb > heavilyAt) tier = "heavily";
  else if (totalLb > encumberedAt) tier = "encumbered";

  return { totalLb, capacityLb, tier, encumberedAt, heavilyAt };
}
