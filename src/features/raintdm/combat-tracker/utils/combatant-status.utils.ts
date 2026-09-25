import type { Combatant, CombatantStatus } from "./combat-tracker.types";

/** Derive combatant status from HP and death saves (never stored). */
export function getCombatantStatus(combatant: Combatant): CombatantStatus {
  if (combatant.hp.current > 0) return "active";

  if (combatant.kind === "npc") return "defeated";

  if (combatant.deathSaves.failures >= 3) return "dead";
  if (combatant.deathSaves.successes >= 3) return "stable";
  return "dying";
}

/** Whether Next/Prev Turn should skip this combatant. */
export function isSkippedInTurnOrder(combatant: Combatant): boolean {
  const status = getCombatantStatus(combatant);
  return status === "defeated" || status === "dead";
}

export function canActInCombat(combatant: Combatant): boolean {
  return !isSkippedInTurnOrder(combatant);
}
