import type {
  AbilityBonus,
  AbilityBonusWeightedDistribution,
  AbilityKey,
  AbilityScores,
  BackgroundAsiMode,
  Species,
} from "@/shared/types";
import { ABILITY_LABELS } from "@/shared/types";

export interface AbilityBonusSource {
  label: string;
  amount: number;
}

export interface AbilityScoreBreakdown {
  base: number;
  bonus: number;
  total: number;
  sources: AbilityBonusSource[];
}

export interface SpeciesChooseSlot {
  blockIndex: number;
  slotIndex: number;
  from: AbilityKey[];
  amount: number;
}

export interface BackgroundAsiOptions {
  name: string;
  abilityBonuses: AbilityBonus[];
}

const EMPTY_BONUSES: Record<AbilityKey, number> = {
  str: 0,
  dex: 0,
  con: 0,
  int: 0,
  wis: 0,
  cha: 0,
};

export function getWeightedDistributionBonus(
  bonuses: AbilityBonus[],
): AbilityBonusWeightedDistribution | null {
  const match = bonuses.find(
    (bonus): bonus is AbilityBonusWeightedDistribution =>
      bonus.kind === "weightedDistribution",
  );
  return match ?? null;
}

export function hasBackgroundAsi(bonuses: AbilityBonus[]): boolean {
  return getWeightedDistributionBonus(bonuses) !== null;
}

export function getSpeciesChooseSlots(bonuses: AbilityBonus[]): SpeciesChooseSlot[] {
  const slots: SpeciesChooseSlot[] = [];
  bonuses.forEach((bonus, blockIndex) => {
    if (bonus.kind !== "choose") return;
    const count = bonus.count ?? 1;
    for (let slotIndex = 0; slotIndex < count; slotIndex++) {
      slots.push({
        blockIndex,
        slotIndex,
        from: bonus.from,
        amount: bonus.amount,
      });
    }
  });
  return slots;
}

export function buildAbilityBonusMap(
  species: Species | null,
  options: {
    useTashaOrigin: boolean;
    tashaPlus2: AbilityKey | null;
    tashaPlus1: AbilityKey | null;
    speciesChoices: (AbilityKey | null)[];
    background?: BackgroundAsiOptions | null;
    backgroundAsiMode?: BackgroundAsiMode | null;
    backgroundAsiPlus2?: AbilityKey | null;
    backgroundAsiPlus1?: AbilityKey | null;
  },
): Record<AbilityKey, AbilityScoreBreakdown> {
  const result = Object.fromEntries(
    (Object.keys(EMPTY_BONUSES) as AbilityKey[]).map((key) => [
      key,
      { base: 0, bonus: 0, total: 0, sources: [] as AbilityBonusSource[] },
    ]),
  ) as Record<AbilityKey, AbilityScoreBreakdown>;

  const addBonus = (key: AbilityKey, amount: number, label: string) => {
    result[key].bonus += amount;
    result[key].sources.push({ label, amount });
  };

  const backgroundAsi = options.background
    ? getWeightedDistributionBonus(options.background.abilityBonuses)
    : null;

  if (backgroundAsi && options.background) {
    const label = options.background.name;
    if (options.backgroundAsiMode === "plus1each") {
      for (const key of backgroundAsi.from) {
        addBonus(key, 1, `${label} (+1)`);
      }
    } else if (options.backgroundAsiMode === "plus2plus1") {
      if (options.backgroundAsiPlus2) {
        addBonus(options.backgroundAsiPlus2, 2, `${label} (+2)`);
      }
      if (options.backgroundAsiPlus1) {
        addBonus(options.backgroundAsiPlus1, 1, `${label} (+1)`);
      }
    }
    return result;
  }

  if (options.useTashaOrigin && species) {
    if (options.tashaPlus2) {
      addBonus(options.tashaPlus2, 2, "Tasha (+2)");
    }
    if (options.tashaPlus1) {
      addBonus(options.tashaPlus1, 1, "Tasha (+1)");
    }
    return result;
  }

  if (!species) return result;

  let choiceIndex = 0;

  for (const bonus of species.abilityBonuses) {
    if (bonus.kind === "fixed") {
      for (const [key, amount] of Object.entries(bonus.bonuses) as [
        AbilityKey,
        number,
      ][]) {
        if (typeof amount === "number" && amount > 0) {
          addBonus(key, amount, `${species.name} (+${amount})`);
        }
      }
      continue;
    }

    if (bonus.kind !== "choose") continue;

    const count = bonus.count ?? 1;
    for (let slotIndex = 0; slotIndex < count; slotIndex++) {
      const chosen = options.speciesChoices[choiceIndex] ?? null;
      if (chosen) {
        addBonus(chosen, bonus.amount, `${species.name} (+${bonus.amount})`);
      }
      choiceIndex += 1;
    }
  }

  return result;
}

export function applyBaseScores(
  bonusMap: Record<AbilityKey, AbilityScoreBreakdown>,
  baseScores: AbilityScores,
): Record<AbilityKey, AbilityScoreBreakdown> {
  const next = { ...bonusMap };
  for (const key of Object.keys(EMPTY_BONUSES) as AbilityKey[]) {
    const base = baseScores[key];
    const entry = next[key];
    next[key] = {
      ...entry,
      base,
      total: base + entry.bonus,
    };
  }
  return next;
}

export function effectiveModifier(base: number, bonus: number): number {
  return Math.floor((base + bonus - 10) / 2);
}

export function formatBonusTooltip(breakdown: AbilityScoreBreakdown): string {
  if (breakdown.bonus <= 0) {
    return `Base: ${breakdown.base}`;
  }

  const lines = [
    `Base: ${breakdown.base}`,
    ...breakdown.sources.map((s) => `${s.label}: +${s.amount}`),
    `Total: ${breakdown.total}`,
  ];
  return lines.join("\n");
}

export function formatChooseSlotLabel(slot: SpeciesChooseSlot): string {
  return `+${slot.amount} ${slot.from.map((k) => ABILITY_LABELS[k]).join(" / ")}`;
}
