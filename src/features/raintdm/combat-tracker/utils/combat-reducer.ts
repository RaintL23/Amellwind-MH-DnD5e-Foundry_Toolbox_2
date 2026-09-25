import { rollDie } from "@/features/amellwind/environments/utils/environmentRoll.utils";
import type { ApplyHpChangeOptions } from "./hp.utils";
import { applyHpChange } from "./hp.utils";
import { resolveDeathSave, setDeathSaveCount } from "./death-saves.utils";
import { canActInCombat } from "./combatant-status.utils";
import { rollInitiative, sortByInitiative } from "./initiative.utils";
import type { Combatant, CombatState } from "./combat-tracker.types";
import { createEmptyCombatState } from "./combat-tracker.types";

export type CombatAction =
  | { type: "ADD"; combatant: Combatant }
  | { type: "ADD_MANY"; combatants: Combatant[] }
  | { type: "UPDATE"; id: string; patch: Partial<Combatant> }
  | { type: "REMOVE"; id: string }
  | { type: "SET_INITIATIVE"; id: string; initiative: number | null }
  | { type: "ROLL_INITIATIVE"; scope: "all" | "npcs" }
  | { type: "ROLL_ONE_INITIATIVE"; id: string }
  | { type: "START" }
  | { type: "NEXT_TURN" }
  | { type: "PREV_TURN" }
  | {
      type: "APPLY_HP";
      ids: string[];
      delta: number;
      opts?: ApplyHpChangeOptions;
    }
  | {
      type: "TOGGLE_DEATH_SAVE";
      id: string;
      side: "successes" | "failures";
      count: number;
    }
  | { type: "ROLL_DEATH_SAVE"; id: string }
  | { type: "END_COMBAT" }
  | { type: "HYDRATE"; state: CombatState };

function mapCombatant(
  state: CombatState,
  id: string,
  fn: (c: Combatant) => Combatant,
): CombatState {
  return {
    ...state,
    combatants: state.combatants.map((c) => (c.id === id ? fn(c) : c)),
  };
}

function findNextActable(
  ordered: Combatant[],
  fromIndex: number,
  direction: 1 | -1,
): { id: string; wrapped: boolean } | null {
  if (ordered.length === 0) return null;
  const actable = ordered.filter(canActInCombat);
  if (actable.length === 0) return null;

  let wrapped = false;
  let i = fromIndex;
  for (let step = 0; step < ordered.length; step++) {
    i += direction;
    if (i >= ordered.length) {
      i = 0;
      wrapped = true;
    } else if (i < 0) {
      i = ordered.length - 1;
      wrapped = true;
    }
    if (canActInCombat(ordered[i])) {
      return { id: ordered[i].id, wrapped };
    }
  }
  return null;
}

function advanceTurn(
  state: CombatState,
  direction: 1 | -1,
): CombatState {
  if (!state.started || state.combatants.length === 0) return state;

  const ordered = sortByInitiative(state.combatants);
  const currentIndex = state.activeId
    ? ordered.findIndex((c) => c.id === state.activeId)
    : -1;

  // Start from -1 so NEXT from null picks first; PREV from null picks last.
  const startIndex =
    currentIndex >= 0 ? currentIndex : direction === 1 ? -1 : ordered.length;

  const next = findNextActable(ordered, startIndex, direction);
  if (!next) return state;

  let round = state.round;
  if (direction === 1 && next.wrapped && currentIndex >= 0) {
    round += 1;
  } else if (direction === -1 && next.wrapped && currentIndex >= 0) {
    round = Math.max(1, round - 1);
  }

  return {
    ...state,
    activeId: next.id,
    round,
  };
}

export function combatReducer(
  state: CombatState,
  action: CombatAction,
): CombatState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "ADD":
      return {
        ...state,
        combatants: [...state.combatants, action.combatant],
      };

    case "ADD_MANY":
      return {
        ...state,
        combatants: [...state.combatants, ...action.combatants],
      };

    case "UPDATE":
      return mapCombatant(state, action.id, (c) => {
        const next = { ...c, ...action.patch };
        if (action.patch.hp) {
          next.hp = { ...c.hp, ...action.patch.hp };
        }
        if (action.patch.deathSaves) {
          next.deathSaves = { ...c.deathSaves, ...action.patch.deathSaves };
        }
        return next;
      });

    case "REMOVE": {
      const combatants = state.combatants.filter((c) => c.id !== action.id);
      let activeId = state.activeId;
      if (activeId === action.id) {
        const ordered = sortByInitiative(combatants);
        const actable = ordered.find(canActInCombat);
        activeId = actable?.id ?? null;
      }
      return { ...state, combatants, activeId };
    }

    case "SET_INITIATIVE":
      return mapCombatant(state, action.id, (c) => ({
        ...c,
        initiative: action.initiative,
      }));

    case "ROLL_INITIATIVE":
      return {
        ...state,
        combatants: state.combatants.map((c) => {
          if (action.scope === "npcs" && c.kind !== "npc") return c;
          return {
            ...c,
            initiative: rollInitiative(c.initiativeMod, c.dexScore),
          };
        }),
      };

    case "ROLL_ONE_INITIATIVE":
      return mapCombatant(state, action.id, (c) => ({
        ...c,
        initiative: rollInitiative(c.initiativeMod, c.dexScore),
      }));

    case "START": {
      if (state.combatants.length === 0) return state;
      const ordered = sortByInitiative(state.combatants);
      const first = ordered.find(canActInCombat) ?? ordered[0];
      return {
        ...state,
        started: true,
        round: 1,
        activeId: first?.id ?? null,
      };
    }

    case "NEXT_TURN":
      return advanceTurn(state, 1);

    case "PREV_TURN":
      return advanceTurn(state, -1);

    case "APPLY_HP": {
      const idSet = new Set(action.ids);
      return {
        ...state,
        combatants: state.combatants.map((c) =>
          idSet.has(c.id)
            ? applyHpChange(c, action.delta, action.opts)
            : c,
        ),
      };
    }

    case "TOGGLE_DEATH_SAVE":
      return mapCombatant(state, action.id, (c) =>
        setDeathSaveCount(c, action.side, action.count),
      );

    case "ROLL_DEATH_SAVE": {
      const d20 = rollDie(20);
      return mapCombatant(state, action.id, (c) => {
        if (c.kind !== "pc" || c.hp.current > 0) return c;
        return resolveDeathSave(c, d20).combatant;
      });
    }

    case "END_COMBAT":
      return createEmptyCombatState();

    default:
      return state;
  }
}
