import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AttackDamageConfig,
  AttackResolution,
  DamageCalculatorState,
  DiceGroup,
  FlatBonus,
  RollMode,
  WeaponSetup,
} from "../types/damage-calculator.types";
import type { DamageType } from "@/shared/types";
import {
  calcWeaponDamage,
  createDefaultAttack,
  createDefaultFlatBonus,
  createDefaultWeapon,
  newId,
} from "../utils/damage-math.utils";

const STORAGE_KEY = "damage-calculator-state";

type LegacyAttack = AttackDamageConfig & {
  flatBonus?: number;
  targetSaveBonus?: number;
};

type LegacyWeaponSetup = WeaponSetup & {
  rollMode?: RollMode;
  resolution?: AttackResolution;
  saveDC?: number;
  targetSaveBonus?: number;
  halfDamageOnSave?: boolean;
  damageResistances?: DamageType[];
  damageImmunities?: DamageType[];
  attacks: LegacyAttack[];
};

function normalizeFlatBonuses(attack: LegacyAttack): FlatBonus[] {
  if (attack.flatBonuses?.length) return attack.flatBonuses;
  if (typeof attack.flatBonus === "number") {
    return [createDefaultFlatBonus(attack.flatBonus)];
  }
  return [createDefaultFlatBonus()];
}

function normalizeWeapon(weapon: LegacyWeaponSetup): WeaponSetup {
  const legacyRollMode = weapon.rollMode ?? "normal";
  const legacyResolution = weapon.resolution ?? "attack-roll";
  const legacySaveDC = weapon.saveDC ?? 13;
  const legacyTargetSaveBonus =
    weapon.targetSaveBonus ?? weapon.attacks[0]?.targetSaveBonus ?? 2;
  const legacyHalfDamageOnSave = weapon.halfDamageOnSave ?? true;
  const {
    rollMode: _rollMode,
    resolution: _resolution,
    saveDC: _saveDC,
    targetSaveBonus: _legacyTargetSaveBonus,
    halfDamageOnSave: _halfDamageOnSave,
    ...rest
  } = weapon;

  return {
    ...rest,
    targetSaveBonus: legacyTargetSaveBonus,
    damageResistances: weapon.damageResistances ?? [],
    damageImmunities: weapon.damageImmunities ?? [],
    attacks: weapon.attacks.map((attack) => {
      const legacyAttack = attack as LegacyAttack;
      const { flatBonus: _flatBonus, targetSaveBonus: _attackSaveBonus, ...attackRest } =
        legacyAttack;
      return {
        ...attackRest,
        flatBonuses: normalizeFlatBonuses(legacyAttack),
        rollMode: attack.rollMode ?? legacyRollMode,
        resolution: attack.resolution ?? legacyResolution,
        saveDC: attack.saveDC ?? legacySaveDC,
        halfDamageOnSave: attack.halfDamageOnSave ?? legacyHalfDamageOnSave,
      };
    }),
  };
}

function loadState(): DamageCalculatorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as DamageCalculatorState;
    if (!parsed.weapons?.length || !parsed.selectedWeaponId) throw new Error("invalid");
    return {
      ...parsed,
      weapons: parsed.weapons.map((w) => normalizeWeapon(w as LegacyWeaponSetup)),
    };
  } catch {
    const weapon = createDefaultWeapon();
    return { weapons: [weapon], selectedWeaponId: weapon.id };
  }
}

function saveState(state: DamageCalculatorState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useDamageCalculator() {
  const [state, setState] = useState<DamageCalculatorState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const selectedWeapon = useMemo(
    () =>
      state.weapons.find((w) => w.id === state.selectedWeaponId) ??
      state.weapons[0],
    [state.weapons, state.selectedWeaponId],
  );

  const weaponResults = useMemo(
    () => state.weapons.map((w) => calcWeaponDamage(w)),
    [state.weapons],
  );

  const selectedResult = useMemo(
    () =>
      weaponResults.find((r) => r.weaponId === selectedWeapon?.id) ??
      weaponResults[0],
    [weaponResults, selectedWeapon?.id],
  );

  const updateWeapon = useCallback(
    (weaponId: string, patch: Partial<WeaponSetup>) => {
      setState((prev) => ({
        ...prev,
        weapons: prev.weapons.map((w) =>
          w.id === weaponId ? { ...w, ...patch } : w,
        ),
      }));
    },
    [],
  );

  const selectWeapon = useCallback((weaponId: string) => {
    setState((prev) => ({ ...prev, selectedWeaponId: weaponId }));
  }, []);

  const addWeapon = useCallback(() => {
    setState((prev) => {
      const weapon = createDefaultWeapon(`Weapon ${prev.weapons.length + 1}`);
      return {
        weapons: [...prev.weapons, weapon],
        selectedWeaponId: weapon.id,
      };
    });
  }, []);

  const removeWeapon = useCallback((weaponId: string) => {
    setState((prev) => {
      if (prev.weapons.length <= 1) return prev;
      const weapons = prev.weapons.filter((w) => w.id !== weaponId);
      const selectedWeaponId =
        prev.selectedWeaponId === weaponId
          ? weapons[0].id
          : prev.selectedWeaponId;
      return { weapons, selectedWeaponId };
    });
  }, []);

  const duplicateWeapon = useCallback((weaponId: string) => {
    setState((prev) => {
      const source = prev.weapons.find((w) => w.id === weaponId);
      if (!source) return prev;
      const copy: WeaponSetup = {
        ...source,
        id: newId(),
        name: `${source.name} (copy)`,
        attacks: source.attacks.map((a) => ({
          ...a,
          id: newId(),
          diceGroups: a.diceGroups.map((d) => ({ ...d, id: newId() })),
          flatBonuses: a.flatBonuses.map((b) => ({ ...b, id: newId() })),
        })),
      };
      return {
        weapons: [...prev.weapons, copy],
        selectedWeaponId: copy.id,
      };
    });
  }, []);

  const updateAttack = useCallback(
    (
      weaponId: string,
      attackId: string,
      patch: Partial<AttackDamageConfig>,
    ) => {
      setState((prev) => ({
        ...prev,
        weapons: prev.weapons.map((w) => {
          if (w.id !== weaponId) return w;
          return {
            ...w,
            attacks: w.attacks.map((a) =>
              a.id === attackId ? { ...a, ...patch } : a,
            ),
          };
        }),
      }));
    },
    [],
  );

  const addAttack = useCallback((weaponId: string) => {
    setState((prev) => ({
      ...prev,
      weapons: prev.weapons.map((w) => {
        if (w.id !== weaponId) return w;
        const index = w.attacks.length;
        return { ...w, attacks: [...w.attacks, createDefaultAttack(index)] };
      }),
    }));
  }, []);

  const removeAttack = useCallback((weaponId: string, attackId: string) => {
    setState((prev) => ({
      ...prev,
      weapons: prev.weapons.map((w) => {
        if (w.id !== weaponId) return w;
        if (w.attacks.length <= 1) return w;
        const attacks = w.attacks.filter((a) => a.id !== attackId);
        return {
          ...w,
          attacks: attacks.map((a, i) => ({
            ...a,
            label: a.label.startsWith("Attack ") ? `Attack ${i + 1}` : a.label,
          })),
        };
      }),
    }));
  }, []);

  const addDiceGroup = useCallback(
    (weaponId: string, attackId: string, sides = 6) => {
      setState((prev) => ({
        ...prev,
        weapons: prev.weapons.map((w) => {
          if (w.id !== weaponId) return w;
          return {
            ...w,
            attacks: w.attacks.map((a) => {
              if (a.id !== attackId) return a;
              const group: DiceGroup = { id: newId(), count: 1, sides };
              return { ...a, diceGroups: [...a.diceGroups, group] };
            }),
          };
        }),
      }));
    },
    [],
  );

  const updateDiceGroup = useCallback(
    (
      weaponId: string,
      attackId: string,
      diceId: string,
      patch: Partial<DiceGroup>,
    ) => {
      setState((prev) => ({
        ...prev,
        weapons: prev.weapons.map((w) => {
          if (w.id !== weaponId) return w;
          return {
            ...w,
            attacks: w.attacks.map((a) => {
              if (a.id !== attackId) return a;
              return {
                ...a,
                diceGroups: a.diceGroups.map((d) =>
                  d.id === diceId ? { ...d, ...patch } : d,
                ),
              };
            }),
          };
        }),
      }));
    },
    [],
  );

  const removeDiceGroup = useCallback(
    (weaponId: string, attackId: string, diceId: string) => {
      setState((prev) => ({
        ...prev,
        weapons: prev.weapons.map((w) => {
          if (w.id !== weaponId) return w;
          return {
            ...w,
            attacks: w.attacks.map((a) => {
              if (a.id !== attackId) return a;
              if (a.diceGroups.length <= 1) return a;
              return {
                ...a,
                diceGroups: a.diceGroups.filter((d) => d.id !== diceId),
              };
            }),
          };
        }),
      }));
    },
    [],
  );

  const addFlatBonus = useCallback((weaponId: string, attackId: string) => {
    setState((prev) => ({
      ...prev,
      weapons: prev.weapons.map((w) => {
        if (w.id !== weaponId) return w;
        return {
          ...w,
          attacks: w.attacks.map((a) => {
            if (a.id !== attackId) return a;
            return {
              ...a,
              flatBonuses: [...a.flatBonuses, createDefaultFlatBonus()],
            };
          }),
        };
      }),
    }));
  }, []);

  const updateFlatBonus = useCallback(
    (
      weaponId: string,
      attackId: string,
      bonusId: string,
      patch: Partial<FlatBonus>,
    ) => {
      setState((prev) => ({
        ...prev,
        weapons: prev.weapons.map((w) => {
          if (w.id !== weaponId) return w;
          return {
            ...w,
            attacks: w.attacks.map((a) => {
              if (a.id !== attackId) return a;
              return {
                ...a,
                flatBonuses: a.flatBonuses.map((b) =>
                  b.id === bonusId ? { ...b, ...patch } : b,
                ),
              };
            }),
          };
        }),
      }));
    },
    [],
  );

  const removeFlatBonus = useCallback(
    (weaponId: string, attackId: string, bonusId: string) => {
      setState((prev) => ({
        ...prev,
        weapons: prev.weapons.map((w) => {
          if (w.id !== weaponId) return w;
          return {
            ...w,
            attacks: w.attacks.map((a) => {
              if (a.id !== attackId) return a;
              if (a.flatBonuses.length <= 1) return a;
              return {
                ...a,
                flatBonuses: a.flatBonuses.filter((b) => b.id !== bonusId),
              };
            }),
          };
        }),
      }));
    },
    [],
  );

  return {
    weapons: state.weapons,
    selectedWeapon,
    selectedResult,
    weaponResults,
    selectWeapon,
    addWeapon,
    removeWeapon,
    duplicateWeapon,
    updateWeapon,
    updateAttack,
    addAttack,
    removeAttack,
    addDiceGroup,
    updateDiceGroup,
    removeDiceGroup,
    addFlatBonus,
    updateFlatBonus,
    removeFlatBonus,
  };
}
