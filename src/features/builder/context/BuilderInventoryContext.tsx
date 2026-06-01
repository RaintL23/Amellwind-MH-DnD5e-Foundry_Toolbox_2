import {
  createContext,
  // useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Weapon, ArmorItem } from "@/shared/types";
import { BASE_ARMORS } from "../data/armor.placeholder";

interface BuilderInventoryContextValue {
  weapons: Weapon[];
  armors: ArmorItem[];
  addWeapon: (weapon: Weapon) => void;
  removeWeapon: (name: string) => void;
  addArmor: (armor: ArmorItem) => void;
  removeArmor: (name: string) => void;
  clearInventory: () => void;
  totalItems: number;
}

const BuilderInventoryContext =
  createContext<BuilderInventoryContextValue | null>(null);

export function BuilderInventoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [armors, setArmors] = useState<ArmorItem[]>(BASE_ARMORS);

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

  const clearInventory = useCallback(() => {
    setWeapons([]);
    setArmors(BASE_ARMORS);
  }, []);

  const totalItems = weapons.length;

  return (
    <BuilderInventoryContext.Provider
      value={{
        weapons,
        armors,
        addWeapon,
        removeWeapon,
        addArmor,
        removeArmor,
        clearInventory,
        totalItems,
      }}
    >
      {children}
    </BuilderInventoryContext.Provider>
  );
}

// export function useBuilderInventory(): BuilderInventoryContextValue {
//   const ctx = useContext(BuilderInventoryContext);
//   if (!ctx)
//     throw new Error("useBuilderInventory must be used inside BuilderInventoryProvider");
//   return ctx;
// }
