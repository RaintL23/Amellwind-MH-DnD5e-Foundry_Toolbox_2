import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  AbilityKey,
  AbilityScores,
  EquippedWeapon,
  EquippedArmor,
  EquippedTrinket,
  Rune,
  Weapon,
  ArmorItem,
  CombatCalculation,
} from "@/shared/types";
import { Character } from "../models/Character";
import { calculateCombat } from "../utils/combat.calculator";
import { wouldViolateRule, RuleViolation } from "@/features/runes/utils/build.validation";
import {
  getWeaponShieldAcBonus,
  weaponIncludesShield,
} from "@/features/weapons/utils/shield.utils";

// ─── Context Value ───────────────────────────────────────────────────────────

interface CharacterBuilderContextValue {
  // Character
  character: Character;
  setLevel: (level: number) => void;
  setAbilityScore: (ability: AbilityKey, value: number) => void;
  attacksPerTurnOverride: number | null;
  setAttacksPerTurnOverride: (value: number | null) => void;
  effectiveAttacksPerTurn: number;

  // Equipment
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;

  // Weapon handling
  isTwoHanded: boolean;
  isOffHandBlocked: boolean;
  /** Main-hand weapon includes a shield and off-hand is occupied by it. */
  hasIntegratedShield: boolean;
  integratedShieldAcBonus: number;

  equipWeapon: (slot: "mainHand" | "offHand", weapon: Weapon, rarity: string) => void;
  unequipWeapon: (slot: "mainHand" | "offHand") => void;
  setWeaponRarity: (slot: "mainHand" | "offHand", rarity: string) => void;
  setVersatileMode: (slot: "mainHand" | "offHand", twoHanded: boolean) => void;
  equipArmor: (armor: ArmorItem) => void;
  unequipArmor: () => void;
  setArmorRarity: (rarity: string) => void;
  equipTrinket: (slot: "trinket1" | "trinket2", name: string) => void;
  unequipTrinket: (slot: "trinket1" | "trinket2") => void;

  // Rune management
  assignWeaponRune: (slot: "mainHand" | "offHand", index: number, rune: Rune) => RuleViolation | null;
  removeWeaponRune: (slot: "mainHand" | "offHand", index: number) => void;
  assignArmorRune: (index: number, rune: Rune) => RuleViolation | null;
  removeArmorRune: (index: number) => void;
  assignTrinketRune: (slot: "trinket1" | "trinket2", rune: Rune) => void;
  removeTrinketRune: (slot: "trinket1" | "trinket2") => void;

  // Computed
  totalAC: number;
  combat: CombatCalculation;

  // Reset
  resetBuild: () => void;
}

const CharacterBuilderContext = createContext<CharacterBuilderContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RARITY_SLOT_MAP: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  "Very Rare": 4,
  Legendary: 5,
};

function getRuneSlots(rarity: string): number {
  return RARITY_SLOT_MAP[rarity] ?? 1;
}

function makeWeaponSlot(weapon: Weapon, rarity: string): EquippedWeapon {
  const runeSlots = getRuneSlots(rarity);
  // Two-handed weapons default to useVersatile=true; versatile weapons default to one-handed
  const isTwoHanded = weapon.properties.includes("2H");
  return {
    weapon,
    rarity,
    runeSlots,
    runes: new Array<Rune | null>(runeSlots).fill(null),
    useVersatile: isTwoHanded,
  };
}

function makeArmorSlot(armor: ArmorItem, rarity: string): EquippedArmor {
  const runeSlots = getRuneSlots(rarity);
  return {
    armor,
    rarity,
    runeSlots,
    runes: new Array<Rune | null>(runeSlots).fill(null),
  };
}

/** Checks if a weapon requires or is using both hands */
function isWeaponTwoHanded(equipped: EquippedWeapon | null): boolean {
  if (!equipped) return false;
  // Always two-handed (2H property)
  if (equipped.weapon.properties.includes("2H")) return true;
  // Versatile used in two-handed mode
  if (equipped.weapon.properties.includes("V") && equipped.useVersatile) return true;
  return false;
}

function showsIntegratedShield(mainHand: EquippedWeapon | null): boolean {
  if (!mainHand || !weaponIncludesShield(mainHand.weapon)) return false;
  return !isWeaponTwoHanded(mainHand);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CharacterBuilderProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [character, setCharacter] = useState<Character>(() => new Character());
  const [attacksPerTurnOverride, setAttacksPerTurnOverride] = useState<number | null>(null);
  const [mainHand, setMainHand] = useState<EquippedWeapon | null>(null);
  const [offHand, setOffHand] = useState<EquippedWeapon | null>(null);
  const [armor, setArmor] = useState<EquippedArmor | null>(null);
  const [trinket1, setTrinket1] = useState<EquippedTrinket | null>(null);
  const [trinket2, setTrinket2] = useState<EquippedTrinket | null>(null);

  // ─── Character mutations ─────────────────────────────────────────────────

  const setLevel = useCallback((level: number) => {
    setCharacter((prev) => prev.withUpdates({ level }));
  }, []);

  const setAbilityScore = useCallback((ability: AbilityKey, value: number) => {
    const clamped = Math.max(1, Math.min(30, value));
    setCharacter((prev) =>
      prev.withUpdates({ abilities: { [ability]: clamped } as Partial<AbilityScores> })
    );
  }, []);

  // ─── Equipment mutations ─────────────────────────────────────────────────

  const equipWeapon = useCallback(
    (slot: "mainHand" | "offHand", weapon: Weapon, rarity: string) => {
      const equipped = makeWeaponSlot(weapon, rarity);
      if (slot === "mainHand") {
        setMainHand(equipped);
        if (isWeaponTwoHanded(equipped) || weaponIncludesShield(weapon)) {
          setOffHand(null);
        }
      } else if (!showsIntegratedShield(mainHand)) {
        setOffHand(equipped);
      }
    },
    [mainHand],
  );

  const unequipWeapon = useCallback((slot: "mainHand" | "offHand") => {
    if (slot === "offHand") return;
    if (slot === "mainHand") setMainHand(null);
  }, []);

  const setWeaponRarity = useCallback((slot: "mainHand" | "offHand", rarity: string) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      const newSlots = getRuneSlots(rarity);
      // Preserve existing runes up to new slot count
      const newRunes = new Array<Rune | null>(newSlots).fill(null);
      for (let i = 0; i < Math.min(prev.runes.length, newSlots); i++) {
        newRunes[i] = prev.runes[i];
      }
      return { ...prev, rarity, runeSlots: newSlots, runes: newRunes };
    });
  }, []);

  const setVersatileMode = useCallback((slot: "mainHand" | "offHand", twoHanded: boolean) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      return { ...prev, useVersatile: twoHanded };
    });
    // If switching to two-handed on main hand, clear off-hand
    if (slot === "mainHand" && twoHanded) setOffHand(null);
  }, []);

  const equipArmor = useCallback((armorItem: ArmorItem) => {
    setArmor(makeArmorSlot(armorItem, armorItem.rarity));
  }, []);

  const unequipArmor = useCallback(() => setArmor(null), []);

  const setArmorRarity = useCallback((rarity: string) => {
    setArmor((prev) => {
      if (!prev) return prev;
      const newSlots = getRuneSlots(rarity);
      const newRunes = new Array<Rune | null>(newSlots).fill(null);
      for (let i = 0; i < Math.min(prev.runes.length, newSlots); i++) {
        newRunes[i] = prev.runes[i];
      }
      return { ...prev, rarity, runeSlots: newSlots, runes: newRunes };
    });
  }, []);

  const equipTrinket = useCallback((slot: "trinket1" | "trinket2", name: string) => {
    const trinket: EquippedTrinket = { name, rune: null };
    if (slot === "trinket1") setTrinket1(trinket);
    else setTrinket2(trinket);
  }, []);

  const unequipTrinket = useCallback((slot: "trinket1" | "trinket2") => {
    if (slot === "trinket1") setTrinket1(null);
    else setTrinket2(null);
  }, []);

  // ─── Rune mutations ──────────────────────────────────────────────────────

  const assignWeaponRune = useCallback(
    (slot: "mainHand" | "offHand", index: number, rune: Rune): RuleViolation | null => {
      const setter = slot === "mainHand" ? setMainHand : setOffHand;
      let violation: RuleViolation | null = null;

      setter((prev) => {
        if (!prev || index >= prev.runeSlots) return prev;
        violation = wouldViolateRule(rune, prev.runes, "weapon");
        if (violation) return prev;
        const newRunes = [...prev.runes];
        newRunes[index] = rune;
        return { ...prev, runes: newRunes };
      });

      return violation;
    },
    [],
  );

  const removeWeaponRune = useCallback((slot: "mainHand" | "offHand", index: number) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      const newRunes = [...prev.runes];
      newRunes[index] = null;
      return { ...prev, runes: newRunes };
    });
  }, []);

  const assignArmorRune = useCallback(
    (index: number, rune: Rune): RuleViolation | null => {
      let violation: RuleViolation | null = null;
      setArmor((prev) => {
        if (!prev || index >= prev.runeSlots) return prev;
        violation = wouldViolateRule(rune, prev.runes, "armor");
        if (violation) return prev;
        const newRunes = [...prev.runes];
        newRunes[index] = rune;
        return { ...prev, runes: newRunes };
      });
      return violation;
    },
    [],
  );

  const removeArmorRune = useCallback((index: number) => {
    setArmor((prev) => {
      if (!prev) return prev;
      const newRunes = [...prev.runes];
      newRunes[index] = null;
      return { ...prev, runes: newRunes };
    });
  }, []);

  const assignTrinketRune = useCallback((slot: "trinket1" | "trinket2", rune: Rune) => {
    const setter = slot === "trinket1" ? setTrinket1 : setTrinket2;
    setter((prev) => (prev ? { ...prev, rune } : prev));
  }, []);

  const removeTrinketRune = useCallback((slot: "trinket1" | "trinket2") => {
    const setter = slot === "trinket1" ? setTrinket1 : setTrinket2;
    setter((prev) => (prev ? { ...prev, rune: null } : prev));
  }, []);

  // ─── Computed values ─────────────────────────────────────────────────────

  const isTwoHanded = isWeaponTwoHanded(mainHand);
  const isOffHandBlocked = isTwoHanded;
  const hasIntegratedShield = showsIntegratedShield(mainHand);
  const integratedShieldAcBonus = useMemo(() => {
    if (!hasIntegratedShield || !mainHand) return 0;
    return getWeaponShieldAcBonus(mainHand.weapon, mainHand.rarity);
  }, [hasIntegratedShield, mainHand]);

  const effectiveAttacksPerTurn = attacksPerTurnOverride ?? character.getAttacksPerTurn();

  const totalAC = useMemo(() => {
    const dexMod = character.getModifier("dex");
    const armorAc = armor
      ? (() => {
          const { baseAC, maxDexBonus } = armor.armor;
          const dexBonus = maxDexBonus === null ? dexMod : Math.min(dexMod, maxDexBonus);
          return baseAC + dexBonus;
        })()
      : 10 + dexMod;
    return armorAc + integratedShieldAcBonus;
  }, [armor, character, integratedShieldAcBonus]);

  const combat = useMemo(
    () => calculateCombat(character, mainHand, offHand, effectiveAttacksPerTurn),
    [character, mainHand, offHand, effectiveAttacksPerTurn],
  );

  // ─── Reset ───────────────────────────────────────────────────────────────

  const resetBuild = useCallback(() => {
    setCharacter(new Character());
    setMainHand(null);
    setOffHand(null);
    setArmor(null);
    setTrinket1(null);
    setTrinket2(null);
    setAttacksPerTurnOverride(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      character,
      setLevel,
      setAbilityScore,
      attacksPerTurnOverride,
      setAttacksPerTurnOverride,
      effectiveAttacksPerTurn,
      mainHand,
      offHand,
      armor,
      trinket1,
      trinket2,
      isTwoHanded,
      isOffHandBlocked,
      hasIntegratedShield,
      integratedShieldAcBonus,
      equipWeapon,
      unequipWeapon,
      setWeaponRarity,
      setVersatileMode,
      equipArmor,
      unequipArmor,
      setArmorRarity,
      equipTrinket,
      unequipTrinket,
      assignWeaponRune,
      removeWeaponRune,
      assignArmorRune,
      removeArmorRune,
      assignTrinketRune,
      removeTrinketRune,
      totalAC,
      combat,
      resetBuild,
    }),
    [
      character, setLevel, setAbilityScore,
      attacksPerTurnOverride, effectiveAttacksPerTurn,
      mainHand, offHand, armor, trinket1, trinket2,
      isTwoHanded, isOffHandBlocked, hasIntegratedShield, integratedShieldAcBonus,
      equipWeapon, unequipWeapon, setWeaponRarity, setVersatileMode,
      equipArmor, unequipArmor, setArmorRarity, equipTrinket, unequipTrinket,
      assignWeaponRune, removeWeaponRune, assignArmorRune, removeArmorRune,
      assignTrinketRune, removeTrinketRune,
      totalAC, combat, resetBuild,
    ],
  );

  return (
    <CharacterBuilderContext.Provider value={contextValue}>
      {children}
    </CharacterBuilderContext.Provider>
  );
}

export function useCharacterBuilder(): CharacterBuilderContextValue {
  const ctx = useContext(CharacterBuilderContext);
  if (!ctx)
    throw new Error("useCharacterBuilder must be used inside CharacterBuilderProvider");
  return ctx;
}
