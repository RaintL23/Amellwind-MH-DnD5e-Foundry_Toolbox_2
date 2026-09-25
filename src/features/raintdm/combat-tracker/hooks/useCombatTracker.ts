import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ApplyHpChangeOptions } from "../utils/hp.utils";
import { combatReducer, type CombatAction } from "../utils/combat-reducer";
import type { Combatant, CombatState } from "../utils/combat-tracker.types";
import {
  clearCombatState,
  loadCombatState,
  saveCombatState,
} from "../storage/combat-tracker.storage";

const SAVE_DEBOUNCE_MS = 200;

export function useCombatTracker() {
  const [state, dispatch] = useReducer(
    combatReducer,
    undefined,
    loadCombatState,
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (
        state.combatants.length === 0 &&
        !state.started &&
        state.activeId == null
      ) {
        clearCombatState();
      } else {
        saveCombatState(state);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  const addCombatant = useCallback((combatant: Combatant) => {
    dispatch({ type: "ADD", combatant });
  }, []);

  const addCombatants = useCallback((combatants: Combatant[]) => {
    dispatch({ type: "ADD_MANY", combatants });
  }, []);

  const updateCombatant = useCallback(
    (id: string, patch: Partial<Combatant>) => {
      dispatch({ type: "UPDATE", id, patch });
    },
    [],
  );

  const removeCombatant = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const setInitiative = useCallback(
    (id: string, initiative: number | null) => {
      dispatch({ type: "SET_INITIATIVE", id, initiative });
    },
    [],
  );

  const rollInitiative = useCallback((scope: "all" | "npcs") => {
    dispatch({ type: "ROLL_INITIATIVE", scope });
  }, []);

  const rollOneInitiative = useCallback((id: string) => {
    dispatch({ type: "ROLL_ONE_INITIATIVE", id });
  }, []);

  const startCombat = useCallback(() => {
    dispatch({ type: "START" });
  }, []);

  const nextTurn = useCallback(() => {
    dispatch({ type: "NEXT_TURN" });
  }, []);

  const prevTurn = useCallback(() => {
    dispatch({ type: "PREV_TURN" });
  }, []);

  const applyHp = useCallback(
    (ids: string[], delta: number, opts?: ApplyHpChangeOptions) => {
      dispatch({ type: "APPLY_HP", ids, delta, opts });
    },
    [],
  );

  const setDeathSaves = useCallback(
    (id: string, side: "successes" | "failures", count: number) => {
      dispatch({ type: "TOGGLE_DEATH_SAVE", id, side, count });
    },
    [],
  );

  const rollDeathSave = useCallback((id: string) => {
    dispatch({ type: "ROLL_DEATH_SAVE", id });
  }, []);

  const endCombat = useCallback(() => {
    dispatch({ type: "END_COMBAT" });
    clearCombatState();
  }, []);

  const dispatchAction = useCallback((action: CombatAction) => {
    dispatch(action);
  }, []);

  return {
    state: state as CombatState,
    addCombatant,
    addCombatants,
    updateCombatant,
    removeCombatant,
    setInitiative,
    rollInitiative,
    rollOneInitiative,
    startCombat,
    nextTurn,
    prevTurn,
    applyHp,
    setDeathSaves,
    rollDeathSave,
    endCombat,
    dispatchAction,
  };
}
