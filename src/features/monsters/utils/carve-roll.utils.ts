import type { Rune } from "@/shared/types";
import { rollDie, rollD20WithMode, type RollMode } from "@/features/environments/utils/environmentRoll.utils";

export type LootObtainmentMode = "carve" | "capture";

export interface CarveRollResult {
  mode: LootObtainmentMode;
  carveCheck?: {
    d20Rolls: number[];
    rollMode: RollMode;
    modifier: number;
    total: number;
    dc: number;
    success: boolean;
  };
  lootRoll: number;
  rune: Rune | null;
}

export function matchesChanceRange(chance: string, roll: number): boolean {
  if (!chance || chance === "-") return false;

  const trimmed = chance.trim();
  if (trimmed.includes("-")) {
    const [minRaw, maxRaw] = trimmed.split("-");
    const min = Number.parseInt(minRaw.trim(), 10);
    const max = Number.parseInt(maxRaw.trim(), 10);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return roll >= min && roll <= max;
    }
    return false;
  }

  const single = Number.parseInt(trimmed, 10);
  return Number.isFinite(single) && single === roll;
}

export function findRuneByLootRoll(
  runes: Rune[],
  roll: number,
  mode: LootObtainmentMode,
): Rune | null {
  const chanceKey = mode === "carve" ? "carveChance" : "captureChance";
  return runes.find((rune) => matchesChanceRange(rune[chanceKey], roll)) ?? null;
}

export function rollMonsterLoot({
  runes,
  mode,
  carveDc,
  modifier,
  rollMode,
}: {
  runes: Rune[];
  mode: LootObtainmentMode;
  carveDc: number;
  modifier: number;
  rollMode: RollMode;
}): CarveRollResult {
  let carveCheck: CarveRollResult["carveCheck"];
  let lootRoll: number;

  if (mode === "carve") {
    const d20 = rollD20WithMode(rollMode);
    const total = d20.selected + modifier;
    const success = total >= carveDc;

    carveCheck = {
      d20Rolls: d20.rolls,
      rollMode: d20.mode,
      modifier,
      total,
      dc: carveDc,
      success,
    };

    lootRoll = success ? rollDie(20) : 1;
  } else {
    lootRoll = rollDie(20);
  }

  return {
    mode,
    carveCheck,
    lootRoll,
    rune: findRuneByLootRoll(runes, lootRoll, mode),
  };
}

export function formatChanceDisplay(chance: string): string {
  return chance === "-" ? "—" : chance;
}

export function formatSlotsDisplay(slots: Rune["slots"]): string {
  if (slots.length === 0) return "—";
  const labels: string[] = [];
  if (slots.includes("A")) labels.push("A");
  if (slots.includes("W")) labels.push("W");
  return `(${labels.join(",")})`;
}
