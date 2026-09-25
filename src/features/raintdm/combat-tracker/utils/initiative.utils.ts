import { rollDie } from "@/features/amellwind/environments/utils/environmentRoll.utils";
import type { Combatant } from "./combat-tracker.types";

/** Foundry-style tiebreaker: initiative total + Dex/100, rounded to 2 decimals. */
export function withTiebreaker(total: number, dexScore: number): number {
  return Math.round((total + dexScore / 100) * 100) / 100;
}

/** Roll d20 + mod, then apply Dex tiebreaker when available. */
export function rollInitiative(
  initiativeMod: number,
  dexScore: number | null,
): number {
  const total = rollDie(20) + initiativeMod;
  if (dexScore == null) return total;
  return withTiebreaker(total, dexScore);
}

/**
 * Sort combatants by initiative descending. Null initiative sorts last.
 * Stable for equal values (insertion order preserved via index).
 */
export function sortByInitiative(combatants: Combatant[]): Combatant[] {
  return combatants
    .map((c, index) => ({ c, index }))
    .sort((a, b) => {
      const ai = a.c.initiative;
      const bi = b.c.initiative;
      if (ai == null && bi == null) return a.index - b.index;
      if (ai == null) return 1;
      if (bi == null) return -1;
      if (bi !== ai) return bi - ai;
      return a.index - b.index;
    })
    .map(({ c }) => c);
}
