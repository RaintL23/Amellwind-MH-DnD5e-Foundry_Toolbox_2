import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  loadBuilderBackstoryNotes,
  persistBuilderBackstoryNotes,
} from "../storage/builder-backstory.storage";
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
  CharacterSelectionRef,
  BuilderFeatSelection,
} from "@/shared/types";
import { getFeatSlotLevels } from "../utils/builder-class.utils";
import { Character } from "../models/Character";
import { calculateCombat } from "../utils/combat.calculator";
import {
  makeWeaponSlot,
  makeArmorSlot,
  resizeRunesForRarity,
} from "../utils/equipment.factory";
import { wouldViolateRule, RuleViolation } from "@/features/runes/utils/build.validation";
import {
  getWeaponShieldAcBonus,
  hasActiveIntegratedShield,
  weaponIncludesShield,
} from "@/features/weapons/utils/shield.utils";
import {
  blocksOffHand,
  getOffHandBlockReason,
  isDualBladesWeapon,
  isWeaponTwoHanded,
  OffHandBlockReason,
} from "@/features/weapons/utils/weapon-hands.utils";

// ─── Context Value ───────────────────────────────────────────────────────────

interface CharacterBuilderContextValue {
  // Character
  character: Character;
  setLevel: (level: number) => void;
  setAbilityScore: (ability: AbilityKey, value: number) => void;
  setAbilityScores: (abilities: Partial<AbilityScores>) => void;
  attacksPerTurnOverride: number | null;
  setAttacksPerTurnOverride: (value: number | null) => void;
  effectiveAttacksPerTurn: number;

  // Equipment
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;

  // Identity (species / background / class / subclass / feats)
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
  class: CharacterSelectionRef | null;
  subclass: CharacterSelectionRef | null;
  featSelections: (BuilderFeatSelection | null)[];
  backstoryNotes: string;
  setSpecies: (selection: CharacterSelectionRef | null) => void;
  setBackground: (selection: CharacterSelectionRef | null) => void;
  setClass: (selection: CharacterSelectionRef | null) => void;
  setSubclass: (selection: CharacterSelectionRef | null) => void;
  setFeatAtIndex: (index: number, selection: BuilderFeatSelection | null) => void;

  // Ability score origin bonuses (species / Tasha's Cauldron)
  useTashaOrigin: boolean;
  setUseTashaOrigin: (value: boolean) => void;
  tashaPlus2: AbilityKey | null;
  tashaPlus1: AbilityKey | null;
  setTashaPlus2: (ability: AbilityKey | null) => void;
  setTashaPlus1: (ability: AbilityKey | null) => void;
  speciesAbilityChoices: (AbilityKey | null)[];
  setSpeciesAbilityChoice: (index: number, ability: AbilityKey | null) => void;
  setBackstoryNotes: (
    value: string | ((current: string) => string),
  ) => void;

  // Weapon handling
  isTwoHanded: boolean;
  isOffHandBlocked: boolean;
  offHandBlockReason: OffHandBlockReason | null;
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

// ─── Provider ────────────────────────────────────────────────────────────────

export function CharacterBuilderProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [character, setCharacter] = useState<Character>(() => new Character());
  const [attacksPerTurnOverride, setAttacksPerTurnOverride] = useState<number | null>(null);
  const [mainHand, setMainHand] = useState<EquippedWeapon | null>(null);
  const [offHand, setOffHand] = useState<EquippedWeapon | null>(null);
  const [armor, setArmor] = useState<EquippedArmor | null>(null);
  const [trinket1, setTrinket1] = useState<EquippedTrinket | null>(null);
  const [trinket2, setTrinket2] = useState<EquippedTrinket | null>(null);
  const [species, setSpeciesState] = useState<CharacterSelectionRef | null>(null);
  const [background, setBackground] = useState<CharacterSelectionRef | null>(null);
  const [classRef, setClassState] = useState<CharacterSelectionRef | null>(null);
  const [subclass, setSubclassState] = useState<CharacterSelectionRef | null>(null);
  const [featSelections, setFeatSelections] = useState<
    (BuilderFeatSelection | null)[]
  >([]);
  const [useTashaOrigin, setUseTashaOrigin] = useState(false);
  const [tashaPlus2, setTashaPlus2] = useState<AbilityKey | null>(null);
  const [tashaPlus1, setTashaPlus1] = useState<AbilityKey | null>(null);
  const [speciesAbilityChoices, setSpeciesAbilityChoices] = useState<
    (AbilityKey | null)[]
  >([]);
  const [backstoryNotes, setBackstoryNotesState] = useState(
    () => loadBuilderBackstoryNotes(),
  );

  useEffect(() => {
    persistBuilderBackstoryNotes(backstoryNotes);
  }, [backstoryNotes]);

  const setBackstoryNotes = useCallback(
    (value: string | ((current: string) => string)) => {
      setBackstoryNotesState(value);
    },
    [],
  );

  const setSpecies = useCallback((selection: CharacterSelectionRef | null) => {
    setSpeciesState(selection);
    setSpeciesAbilityChoices([]);
    if (!selection) {
      setUseTashaOrigin(false);
      setTashaPlus2(null);
      setTashaPlus1(null);
    }
  }, []);

  const setClass = useCallback((selection: CharacterSelectionRef | null) => {
    setClassState(selection);
    setSubclassState(null);
    setFeatSelections([]);
  }, []);

  const setSubclass = useCallback((selection: CharacterSelectionRef | null) => {
    setSubclassState(selection);
  }, []);

  const setFeatAtIndex = useCallback(
    (index: number, selection: BuilderFeatSelection | null) => {
      setFeatSelections((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = selection;
        return next;
      });
    },
    [],
  );

  const setSpeciesAbilityChoice = useCallback(
    (index: number, ability: AbilityKey | null) => {
      setSpeciesAbilityChoices((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = ability;
        return next;
      });
    },
    [],
  );

  // ─── Character mutations ─────────────────────────────────────────────────

  const setLevel = useCallback((level: number) => {
    setCharacter((prev) => prev.withUpdates({ level }));
    setFeatSelections((prev) => {
      const maxSlots = getFeatSlotLevels(classRef?.name ?? "", level).length;
      return prev.slice(0, maxSlots);
    });
  }, [classRef?.name]);

  const setAbilityScore = useCallback((ability: AbilityKey, value: number) => {
    const clamped = Math.max(1, Math.min(30, value));
    setCharacter((prev) =>
      prev.withUpdates({ abilities: { [ability]: clamped } as Partial<AbilityScores> })
    );
  }, []);

  const setAbilityScores = useCallback((abilities: Partial<AbilityScores>) => {
    const clamped = Object.fromEntries(
      Object.entries(abilities).map(([key, value]) => [
        key,
        Math.max(1, Math.min(30, value as number)),
      ])
    ) as Partial<AbilityScores>;
    setCharacter((prev) =>
      prev.withUpdates({ abilities: { ...prev.abilities, ...clamped } })
    );
  }, []);

  // ─── Equipment mutations ─────────────────────────────────────────────────

  const equipWeapon = useCallback(
    (slot: "mainHand" | "offHand", weapon: Weapon, rarity: string) => {
      const equipped = makeWeaponSlot(weapon, rarity);
      if (slot === "mainHand") {
        setMainHand(equipped);
        if (
          isWeaponTwoHanded(equipped) ||
          weaponIncludesShield(weapon) ||
          isDualBladesWeapon(weapon)
        ) {
          setOffHand(null);
        }
      } else if (!hasActiveIntegratedShield(mainHand) && !blocksOffHand(mainHand)) {
        setOffHand(equipped);
      }
    },
    [mainHand],
  );

  const unequipWeapon = useCallback((slot: "mainHand" | "offHand") => {
    if (slot === "mainHand") setMainHand(null);
    else setOffHand(null);
  }, []);

  const setWeaponRarity = useCallback((slot: "mainHand" | "offHand", rarity: string) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      return { ...prev, ...resizeRunesForRarity(prev.runes, rarity) };
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
      return { ...prev, ...resizeRunesForRarity(prev.runes, rarity) };
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
  const isOffHandBlocked = blocksOffHand(mainHand);
  const offHandBlockReason = getOffHandBlockReason(mainHand);
  const hasIntegratedShield = hasActiveIntegratedShield(mainHand);
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
  }, [armor, character, integratedShieldAcBonus, mainHand]);

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
    setSpecies(null);
    setBackground(null);
    setClassState(null);
    setSubclassState(null);
    setFeatSelections([]);
    setBackstoryNotesState("");
    setAttacksPerTurnOverride(null);
    setUseTashaOrigin(false);
    setTashaPlus2(null);
    setTashaPlus1(null);
    setSpeciesAbilityChoices([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      character,
      setLevel,
      setAbilityScore,
      setAbilityScores,
      attacksPerTurnOverride,
      setAttacksPerTurnOverride,
      effectiveAttacksPerTurn,
      mainHand,
      offHand,
      armor,
      trinket1,
      trinket2,
      species,
      background,
      class: classRef,
      subclass,
      featSelections,
      backstoryNotes,
      setSpecies,
      setBackground,
      setClass,
      setSubclass,
      setFeatAtIndex,
      setBackstoryNotes,
      useTashaOrigin,
      setUseTashaOrigin,
      tashaPlus2,
      tashaPlus1,
      setTashaPlus2,
      setTashaPlus1,
      speciesAbilityChoices,
      setSpeciesAbilityChoice,
      isTwoHanded,
      isOffHandBlocked,
      offHandBlockReason,
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
      character, setLevel, setAbilityScore, setAbilityScores,
      attacksPerTurnOverride, effectiveAttacksPerTurn,
      mainHand, offHand, armor, trinket1, trinket2,
      species, background, classRef, subclass, featSelections, backstoryNotes,
      setBackstoryNotes, setClass, setSubclass, setFeatAtIndex,
      useTashaOrigin, tashaPlus2, tashaPlus1, speciesAbilityChoices, setSpeciesAbilityChoice,
      isTwoHanded, isOffHandBlocked, offHandBlockReason, hasIntegratedShield, integratedShieldAcBonus,
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
