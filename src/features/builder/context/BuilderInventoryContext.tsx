import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Weapon, Rune, ArmorItem } from "@/shared/types";
import { PLACEHOLDER_ARMORS } from "../data/armor.placeholder";

interface BuilderInventoryContextValue {
  weapons: Weapon[];
  armors: ArmorItem[];
  runes: Rune[];
  addWeapon: (weapon: Weapon) => void;
  removeWeapon: (name: string) => void;
  addArmor: (armor: ArmorItem) => void;
  removeArmor: (name: string) => void;
  addRune: (rune: Rune) => void;
  removeRune: (name: string, monsterName: string) => void;
  clearInventory: () => void;
  totalItems: number;
}

const BuilderInventoryContext = createContext<BuilderInventoryContextValue | null>(null);

export function BuilderInventoryProvider({ children }: { children: ReactNode }) {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [armors, setArmors] = useState<ArmorItem[]>(PLACEHOLDER_ARMORS);
  const [runes, setRunes] = useState<Rune[]>([]);

  const addWeapon = useCallback((weapon: Weapon) => {
    setWeapons((prev) => {
      if (prev.some((w) => w.name === weapon.name)) return prev;
      return [...prev, weapon];
    });
  }, []);

  const removeWeapon = useCallback((name: string) => {
    setWeapons((prev) => prev.filter((w) => w.name !== name));
  }, []);

  const addArmor = useCallback((armor: ArmorItem) => {
    setArmors((prev) => {
      if (prev.some((a) => a.name === armor.name)) return prev;
      return [...prev, armor];
    });
  }, []);

  const removeArmor = useCallback((name: string) => {
    setArmors((prev) => prev.filter((a) => a.name !== name));
  }, []);

  const addRune = useCallback((rune: Rune) => {
    setRunes((prev) => {
      if (prev.some((r) => r.name === rune.name && r.monsterName === rune.monsterName))
        return prev;
      return [...prev, rune];
    });
  }, []);

  const removeRune = useCallback((name: string, monsterName: string) => {
    setRunes((prev) =>
      prev.filter((r) => !(r.name === name && r.monsterName === monsterName))
    );
  }, []);

  const clearInventory = useCallback(() => {
    setWeapons([]);
    setArmors(PLACEHOLDER_ARMORS);
    setRunes([]);
  }, []);

  const totalItems = weapons.length + runes.length;

  return (
    <BuilderInventoryContext.Provider
      value={{
        weapons,
        armors,
        runes,
        addWeapon,
        removeWeapon,
        addArmor,
        removeArmor,
        addRune,
        removeRune,
        clearInventory,
        totalItems,
      }}
    >
      {children}
    </BuilderInventoryContext.Provider>
  );
}

export function useBuilderInventory(): BuilderInventoryContextValue {
  const ctx = useContext(BuilderInventoryContext);
  if (!ctx)
    throw new Error("useBuilderInventory must be used inside BuilderInventoryProvider");
  return ctx;
}
