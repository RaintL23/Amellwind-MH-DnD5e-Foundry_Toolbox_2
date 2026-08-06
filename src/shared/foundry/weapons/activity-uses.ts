import type { FoundryItem } from "../types";
import type {
  WeaponActivityParams,
  WeaponFeatureAutomationSpec,
} from "./activity.types";
import { parseDice } from "./activity-payload";

export function applyItemUses(
  item: FoundryItem,
  params: WeaponActivityParams,
  overrides: WeaponFeatureAutomationSpec["foundryOverrides"],
  options?: { forceStartsEmpty?: boolean },
): void {
  const system = item.system as Record<string, unknown>;
  if (overrides?.itemUses && typeof overrides.itemUses === "object") {
    system.uses = overrides.itemUses;
    return;
  }
  if (!params.itemUsesMax?.trim()) return;
  if (params.ownsItemUses === false) return;

  const max = params.itemUsesMax.trim();
  const maxNum = Number.parseInt(max, 10);
  const startsEmpty =
    options?.forceStartsEmpty === true || params.poolStartsEmpty === true;

  const recovery = params.itemUsesRecoveryPeriod
    ? [
        {
          period: params.itemUsesRecoveryPeriod,
          type: "recoverAll",
          formula: "",
        },
      ]
    : [];

  // Key order matches Foundry-saved items (spent → recovery → max).
  system.uses = {
    spent: startsEmpty && Number.isFinite(maxNum) ? maxNum : 0,
    recovery,
    max,
  };
}

/** Multiply a simple NdM(+B) formula by counter count (3d6 × 2 → 6d6). */
export function scaleDiceFormulaByCharges(
  formula: string,
  charges: number,
): string {
  const trimmed = formula.trim();
  if (!trimmed || charges <= 1) return trimmed;
  const dice = parseDice(trimmed);
  if (!dice || dice.kind === "custom") {
    return `(${trimmed})*${charges}`;
  }
  return `${dice.number * charges}d${dice.denomination}${dice.bonus}`;
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function resolveSpendRange(params: WeaponActivityParams): {
  spendMin: number;
  spendMax: number;
} {
  const fromMax = Number.parseInt(params.itemUsesMax?.trim() || "", 10);
  const defaultMax = Number.isFinite(fromMax) ? Math.min(fromMax, 12) : 3;
  const spendMin = clampInt(params.spendMin, 1, 1, 12);
  const spendMax = clampInt(params.spendMax, defaultMax, spendMin, 12);
  return { spendMin, spendMax };
}
