import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { Rune } from "@/shared/types";
import { getAllRunes } from "../services/rune.service";
import {
  clearRuneBuild,
  loadRuneBuild,
  persistRuneBuild,
  runeRefKey,
  runeToRef,
  type RuneRef,
} from "../storage/rune-build.storage";

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

/** Resolves persisted rune refs into full runes for a slot array of `size`. */
function resolveSlots(
  refs: (RuneRef | null)[],
  size: number,
  runeMap: Map<string, Rune>,
): (Rune | null)[] {
  return Array.from({ length: size }, (_, i) => {
    const ref = refs[i];
    return ref ? runeMap.get(runeRefKey(ref)) ?? null : null;
  });
}

export function RuneBuildProvider({ children }: { children: ReactNode }) {
  // Persisted build (loaded once). Rarities hydrate synchronously so slot sizes
  // are correct on first render; the runes themselves resolve asynchronously.
  const persistedRef = useRef(loadRuneBuild());
  const persisted = persistedRef.current;
  // Suppress persistence until the async rehydration settles, so the transient
  // empty state doesn't overwrite a saved build.
  const hydratedRef = useRef(!persisted);

  const [weaponRarity, setWeaponRarityState] = useState<ItemRarity>(
    persisted?.weaponRarity ?? "common",
  );
  const [armorRarity, setArmorRarityState] = useState<ItemRarity>(
    persisted?.armorRarity ?? "common",
  );
  const [weaponRunes, setWeaponRunes] = useState<(Rune | null)[]>(() =>
    makeSlots(persisted?.weaponRarity ?? "common"),
  );
  const [armorRunes, setArmorRunes] = useState<(Rune | null)[]>(() =>
    makeSlots(persisted?.armorRarity ?? "common"),
  );
  const [trinket1Rune, setTrinket1Rune] = useState<Rune | null>(null);
  const [trinket2Rune, setTrinket2Rune] = useState<Rune | null>(null);

  useEffect(() => {
    if (!persisted) return;
    let cancelled = false;
    getAllRunes()
      .then((runes) => {
        if (cancelled) return;
        const runeMap = new Map<string, Rune>();
        for (const rune of runes) runeMap.set(runeRefKey(rune), rune);
        setWeaponRunes(
          resolveSlots(
            persisted.weaponRunes,
            RARITY_SLOTS[persisted.weaponRarity],
            runeMap,
          ),
        );
        setArmorRunes(
          resolveSlots(
            persisted.armorRunes,
            RARITY_SLOTS[persisted.armorRarity],
            runeMap,
          ),
        );
        setTrinket1Rune(
          persisted.trinket1Rune
            ? runeMap.get(runeRefKey(persisted.trinket1Rune)) ?? null
            : null,
        );
        setTrinket2Rune(
          persisted.trinket2Rune
            ? runeMap.get(runeRefKey(persisted.trinket2Rune)) ?? null
            : null,
        );
      })
      .finally(() => {
        if (!cancelled) hydratedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
    // Rehydrate exactly once on mount from the snapshot loaded above.
  }, []);

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

  useEffect(() => {
    if (!hydratedRef.current) return;
    const isEmpty =
      totalRunes === 0 &&
      weaponRarity === "common" &&
      armorRarity === "common";
    if (isEmpty) {
      clearRuneBuild();
      return;
    }
    persistRuneBuild({
      weaponRarity,
      armorRarity,
      weaponRunes: weaponRunes.map(runeToRef),
      armorRunes: armorRunes.map(runeToRef),
      trinket1Rune: runeToRef(trinket1Rune),
      trinket2Rune: runeToRef(trinket2Rune),
    });
  }, [
    weaponRarity,
    armorRarity,
    weaponRunes,
    armorRunes,
    trinket1Rune,
    trinket2Rune,
    totalRunes,
  ]);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <RuneBuildContext.Provider value={value}>
      {children}
    </RuneBuildContext.Provider>
  );
}

export function useRuneBuild(): RuneBuildContextValue {
  const ctx = useContext(RuneBuildContext);
  if (!ctx) throw new Error("useRuneBuild must be used inside RuneBuildProvider");
  return ctx;
}
