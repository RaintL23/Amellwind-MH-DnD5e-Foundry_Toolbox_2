import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Rune } from "@/shared/types";

export type ItemRarity = "common" | "uncommon" | "rare" | "very rare" | "legendary";
export type BuildSlotType = "weapon" | "armor" | "trinket1" | "trinket2";

export const RARITY_SLOTS: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  "very rare": 4,
  legendary: 5,
};

export const RARITY_ORDER: ItemRarity[] = [
  "common",
  "uncommon",
  "rare",
  "very rare",
  "legendary",
];

interface RuneBuildContextValue {
  weaponRarity: ItemRarity;
  armorRarity: ItemRarity;
  weaponRunes: (Rune | null)[];
  armorRunes: (Rune | null)[];
  trinket1Rune: Rune | null;
  trinket2Rune: Rune | null;
  setWeaponRarity: (r: ItemRarity) => void;
  setArmorRarity: (r: ItemRarity) => void;
  addRune: (rune: Rune, slotType: BuildSlotType, slotIndex?: number) => boolean;
  removeRune: (slotType: BuildSlotType, slotIndex?: number) => void;
  clearBuild: () => void;
  totalRunes: number;
  isInBuild: (rune: Rune) => boolean;
  allBuildRunes: Rune[];
}

const RuneBuildContext = createContext<RuneBuildContextValue | null>(null);

function makeSlots(rarity: ItemRarity): (Rune | null)[] {
  return Array<Rune | null>(RARITY_SLOTS[rarity]).fill(null);
}

export function RuneBuildProvider({ children }: { children: ReactNode }) {
  const [weaponRarity, setWeaponRarityState] = useState<ItemRarity>("common");
  const [armorRarity, setArmorRarityState] = useState<ItemRarity>("common");
  const [weaponRunes, setWeaponRunes] = useState<(Rune | null)[]>(makeSlots("common"));
  const [armorRunes, setArmorRunes] = useState<(Rune | null)[]>(makeSlots("common"));
  const [trinket1Rune, setTrinket1Rune] = useState<Rune | null>(null);
  const [trinket2Rune, setTrinket2Rune] = useState<Rune | null>(null);

  const setWeaponRarity = useCallback((r: ItemRarity) => {
    setWeaponRarityState(r);
    setWeaponRunes((prev) => {
      const newSize = RARITY_SLOTS[r];
      return Array.from({ length: newSize }, (_, i) => prev[i] ?? null);
    });
  }, []);

  const setArmorRarity = useCallback((r: ItemRarity) => {
    setArmorRarityState(r);
    setArmorRunes((prev) => {
      const newSize = RARITY_SLOTS[r];
      return Array.from({ length: newSize }, (_, i) => prev[i] ?? null);
    });
  }, []);

  const addRune = useCallback(
    (rune: Rune, slotType: BuildSlotType, slotIndex?: number): boolean => {
      if (slotType === "trinket1") {
        setTrinket1Rune(rune);
        return true;
      }
      if (slotType === "trinket2") {
        setTrinket2Rune(rune);
        return true;
      }

      const setter = slotType === "weapon" ? setWeaponRunes : setArmorRunes;
      let placed = false;

      setter((prev) => {
        const next = [...prev];
        if (slotIndex !== undefined && slotIndex < next.length) {
          next[slotIndex] = rune;
          placed = true;
        } else {
          const empty = next.findIndex((s) => s === null);
          if (empty !== -1) {
            next[empty] = rune;
            placed = true;
          }
        }
        return next;
      });

      return placed;
    },
    [],
  );

  const removeRune = useCallback((slotType: BuildSlotType, slotIndex?: number) => {
    if (slotType === "trinket1") { setTrinket1Rune(null); return; }
    if (slotType === "trinket2") { setTrinket2Rune(null); return; }

    const setter = slotType === "weapon" ? setWeaponRunes : setArmorRunes;
    setter((prev) => {
      const next = [...prev];
      if (slotIndex !== undefined) next[slotIndex] = null;
      return next;
    });
  }, []);

  const clearBuild = useCallback(() => {
    setWeaponRunes((prev) => prev.map(() => null));
    setArmorRunes((prev) => prev.map(() => null));
    setTrinket1Rune(null);
    setTrinket2Rune(null);
  }, []);

  const isInBuild = useCallback(
    (rune: Rune): boolean =>
      weaponRunes.some((r) => r?.name === rune.name && r?.monsterName === rune.monsterName) ||
      armorRunes.some((r) => r?.name === rune.name && r?.monsterName === rune.monsterName) ||
      (trinket1Rune?.name === rune.name && trinket1Rune?.monsterName === rune.monsterName) ||
      (trinket2Rune?.name === rune.name && trinket2Rune?.monsterName === rune.monsterName),
    [weaponRunes, armorRunes, trinket1Rune, trinket2Rune],
  );

  const totalRunes =
    weaponRunes.filter(Boolean).length +
    armorRunes.filter(Boolean).length +
    (trinket1Rune ? 1 : 0) +
    (trinket2Rune ? 1 : 0);

  const allBuildRunes: Rune[] = useMemo(() => {
    const seen = new Set<string>();
    const result: Rune[] = [];
    for (const r of [...weaponRunes, ...armorRunes, trinket1Rune, trinket2Rune]) {
      if (!r) continue;
      const key = `${r.name}||${r.monsterName}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(r);
      }
    }
    return result;
  }, [weaponRunes, armorRunes, trinket1Rune, trinket2Rune]);

  return (
    <RuneBuildContext.Provider
      value={{
        weaponRarity,
        armorRarity,
        weaponRunes,
        armorRunes,
        trinket1Rune,
        trinket2Rune,
        setWeaponRarity,
        setArmorRarity,
        addRune,
        removeRune,
        clearBuild,
        totalRunes,
        isInBuild,
        allBuildRunes,
      }}
    >
      {children}
    </RuneBuildContext.Provider>
  );
}

export function useRuneBuild(): RuneBuildContextValue {
  const ctx = useContext(RuneBuildContext);
  if (!ctx) throw new Error("useRuneBuild must be used inside RuneBuildProvider");
  return ctx;
}
