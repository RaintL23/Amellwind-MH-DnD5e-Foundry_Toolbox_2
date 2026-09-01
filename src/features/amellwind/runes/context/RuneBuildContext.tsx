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
import { MaterialEffectSlot, Rune } from "@/shared/types";
import { getArtificerBonusMaterialSlots } from "@/shared/utils/artificer-material-slots.utils";
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

export function getRuneSlotCount(
  rarity: ItemRarity,
  artificerBonusSlots = 0,
): number {
  return RARITY_SLOTS[rarity] + artificerBonusSlots;
}

function resizeSlotArray<T>(prev: T[], newSize: number, fill: T): T[] {
  return Array.from({ length: newSize }, (_, i) => prev[i] ?? fill);
}

interface RuneBuildContextValue {
  weaponRarity: ItemRarity;
  armorRarity: ItemRarity;
  weaponRunes: (Rune | null)[];
  armorRunes: (Rune | null)[];
  trinket1Rune: Rune | null;
  trinket2Rune: Rune | null;
  /** Chosen effect (weapon/armor) for each trinket rune, null when empty. */
  trinket1Kind: MaterialEffectSlot | null;
  trinket2Kind: MaterialEffectSlot | null;
  artificerEnabled: boolean;
  artificerLevel: number;
  artificerBonusSlots: number;
  setArtificerEnabled: (enabled: boolean) => void;
  setArtificerLevel: (level: number) => void;
  setWeaponRarity: (r: ItemRarity) => void;
  setArmorRarity: (r: ItemRarity) => void;
  addRune: (
    rune: Rune,
    slotType: BuildSlotType,
    slotIndex?: number,
    materialEffectKind?: MaterialEffectSlot,
  ) => boolean;
  removeRune: (slotType: BuildSlotType, slotIndex?: number) => void;
  clearBuild: () => void;
  totalRunes: number;
  isInBuild: (rune: Rune) => boolean;
  allBuildRunes: Rune[];
}

const RuneBuildContext = createContext<RuneBuildContextValue | null>(null);

function makeSlots(rarity: ItemRarity, artificerBonusSlots = 0): (Rune | null)[] {
  return Array<Rune | null>(getRuneSlotCount(rarity, artificerBonusSlots)).fill(null);
}

/** Falls back to whichever effect the rune actually has (weapon preferred). */
function defaultMaterialEffectKind(rune: Rune): MaterialEffectSlot {
  return rune.weaponEffect ? "weapon" : "armor";
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
  const initialArtificerEnabled = persisted?.artificerEnabled ?? false;
  const initialArtificerLevel = persisted?.artificerLevel ?? 1;
  const initialArtificerBonus = initialArtificerEnabled
    ? getArtificerBonusMaterialSlots(initialArtificerLevel)
    : 0;
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
    makeSlots(persisted?.weaponRarity ?? "common", initialArtificerBonus),
  );
  const [armorRunes, setArmorRunes] = useState<(Rune | null)[]>(() =>
    makeSlots(persisted?.armorRarity ?? "common", initialArtificerBonus),
  );
  const [artificerEnabled, setArtificerEnabledState] = useState(initialArtificerEnabled);
  const [artificerLevel, setArtificerLevelState] = useState(initialArtificerLevel);
  const [trinket1Rune, setTrinket1Rune] = useState<Rune | null>(null);
  const [trinket2Rune, setTrinket2Rune] = useState<Rune | null>(null);
  const [trinket1Kind, setTrinket1Kind] = useState<MaterialEffectSlot | null>(
    null,
  );
  const [trinket2Kind, setTrinket2Kind] = useState<MaterialEffectSlot | null>(
    null,
  );

  const artificerBonusSlots = artificerEnabled
    ? getArtificerBonusMaterialSlots(artificerLevel)
    : 0;

  useEffect(() => {
    if (!persisted) return;
    let cancelled = false;
    getAllRunes()
      .then((runes) => {
        if (cancelled) return;
        const runeMap = new Map<string, Rune>();
        for (const rune of runes) runeMap.set(runeRefKey(rune), rune);
        const bonus = persisted.artificerEnabled
          ? getArtificerBonusMaterialSlots(persisted.artificerLevel)
          : 0;
        setWeaponRunes(
          resolveSlots(
            persisted.weaponRunes,
            getRuneSlotCount(persisted.weaponRarity, bonus),
            runeMap,
          ),
        );
        setArmorRunes(
          resolveSlots(
            persisted.armorRunes,
            getRuneSlotCount(persisted.armorRarity, bonus),
            runeMap,
          ),
        );
        const resolvedTrinket1 = persisted.trinket1Rune
          ? runeMap.get(runeRefKey(persisted.trinket1Rune)) ?? null
          : null;
        const resolvedTrinket2 = persisted.trinket2Rune
          ? runeMap.get(runeRefKey(persisted.trinket2Rune)) ?? null
          : null;
        setTrinket1Rune(resolvedTrinket1);
        setTrinket2Rune(resolvedTrinket2);
        setTrinket1Kind(
          resolvedTrinket1
            ? persisted.trinket1Kind ?? defaultMaterialEffectKind(resolvedTrinket1)
            : null,
        );
        setTrinket2Kind(
          resolvedTrinket2
            ? persisted.trinket2Kind ?? defaultMaterialEffectKind(resolvedTrinket2)
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

  const setWeaponRarity = useCallback(
    (r: ItemRarity) => {
      setWeaponRarityState(r);
      setWeaponRunes((prev) =>
        resizeSlotArray(
          prev,
          getRuneSlotCount(r, artificerBonusSlots),
          null,
        ),
      );
    },
    [artificerBonusSlots],
  );

  const setArmorRarity = useCallback(
    (r: ItemRarity) => {
      setArmorRarityState(r);
      setArmorRunes((prev) =>
        resizeSlotArray(
          prev,
          getRuneSlotCount(r, artificerBonusSlots),
          null,
        ),
      );
    },
    [artificerBonusSlots],
  );

  const applyArtificerBonus = useCallback((bonus: number) => {
    setWeaponRunes((prev) =>
      resizeSlotArray(prev, getRuneSlotCount(weaponRarity, bonus), null),
    );
    setArmorRunes((prev) =>
      resizeSlotArray(prev, getRuneSlotCount(armorRarity, bonus), null),
    );
  }, [weaponRarity, armorRarity]);

  const setArtificerEnabled = useCallback(
    (enabled: boolean) => {
      setArtificerEnabledState(enabled);
      const bonus = enabled ? getArtificerBonusMaterialSlots(artificerLevel) : 0;
      applyArtificerBonus(bonus);
    },
    [artificerLevel, applyArtificerBonus],
  );

  const setArtificerLevel = useCallback(
    (level: number) => {
      setArtificerLevelState(level);
      if (artificerEnabled) {
        applyArtificerBonus(getArtificerBonusMaterialSlots(level));
      }
    },
    [artificerEnabled, applyArtificerBonus],
  );

  const addRune = useCallback(
    (
      rune: Rune,
      slotType: BuildSlotType,
      slotIndex?: number,
      materialEffectKind?: MaterialEffectSlot,
    ): boolean => {
      if (slotType === "trinket1") {
        setTrinket1Rune(rune);
        setTrinket1Kind(materialEffectKind ?? defaultMaterialEffectKind(rune));
        return true;
      }
      if (slotType === "trinket2") {
        setTrinket2Rune(rune);
        setTrinket2Kind(materialEffectKind ?? defaultMaterialEffectKind(rune));
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
    if (slotType === "trinket1") { setTrinket1Rune(null); setTrinket1Kind(null); return; }
    if (slotType === "trinket2") { setTrinket2Rune(null); setTrinket2Kind(null); return; }

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
    setTrinket1Kind(null);
    setTrinket2Kind(null);
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
      armorRarity === "common" &&
      !artificerEnabled;
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
      trinket1Kind: trinket1Rune ? trinket1Kind : null,
      trinket2Kind: trinket2Rune ? trinket2Kind : null,
      artificerEnabled,
      artificerLevel,
    });
  }, [
    weaponRarity,
    armorRarity,
    weaponRunes,
    armorRunes,
    trinket1Rune,
    trinket2Rune,
    trinket1Kind,
    trinket2Kind,
    totalRunes,
    artificerEnabled,
    artificerLevel,
  ]);

  const value = useMemo(
    () => ({
      weaponRarity,
      armorRarity,
      weaponRunes,
      armorRunes,
      trinket1Rune,
      trinket2Rune,
      trinket1Kind,
      trinket2Kind,
      artificerEnabled,
      artificerLevel,
      artificerBonusSlots,
      setArtificerEnabled,
      setArtificerLevel,
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
      trinket1Kind,
      trinket2Kind,
      artificerEnabled,
      artificerLevel,
      artificerBonusSlots,
      setArtificerEnabled,
      setArtificerLevel,
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
