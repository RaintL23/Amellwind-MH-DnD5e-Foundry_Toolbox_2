/**
 * Combat Tracker domain types. Combatant status is derived from HP / death
 * saves rather than stored, so it never drifts out of sync.
 */

export type CombatantKind = "pc" | "npc";

export type CombatantStatus =
  | "active"
  | "defeated"
  | "dying"
  | "stable"
  | "dead";

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface CombatantSourceRef {
  origin: "dnd-bestiary" | "amellwind";
  name: string;
  source: string;
}

export interface CombatantHp {
  current: number;
  max: number;
  temp: number;
}

export interface Combatant {
  id: string;
  kind: CombatantKind;
  name: string;
  /** Optional player display name (PCs only). */
  playerName?: string;
  hp: CombatantHp;
  ac: number;
  /** "Lv 5" for PCs, CR string (e.g. "1/2") for monsters/NPCs. */
  levelOrCr: string;
  /** Total initiative with 2 decimal places (e.g. 15.14). Null before rolled. */
  initiative: number | null;
  initiativeMod: number;
  /** Dexterity score for Foundry-style tiebreaker (Dex/100). */
  dexScore: number | null;
  deathSaves: DeathSaves;
  lastDeathSaveRoll?: number;
  sourceRef?: CombatantSourceRef;
}

export interface CombatState {
  version: 1;
  combatants: Combatant[];
  started: boolean;
  round: number;
  /** Active turn is stored by id so inserts mid-combat keep the same actor. */
  activeId: string | null;
}

export const EMPTY_DEATH_SAVES: DeathSaves = { successes: 0, failures: 0 };

export function createEmptyCombatState(): CombatState {
  return {
    version: 1,
    combatants: [],
    started: false,
    round: 1,
    activeId: null,
  };
}

export function createCombatantId(): string {
  return `cbt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
