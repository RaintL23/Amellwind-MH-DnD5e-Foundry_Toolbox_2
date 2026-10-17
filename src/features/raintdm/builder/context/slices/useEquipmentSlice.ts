/**
 * Equipment slice: grip slots, armor, shield, trinkets, rune assignment, and
 * derived AC / DPT. Enforces two-handed / dual-grip / integrated-shield rules
 * from Amellwind weapon utils.
 */
import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type SetStateAction,
} from "react";
import type {
  ArmorRarityProperty,
  EquippedWeapon,
  EquippedArmor,
  EquippedTrinket,
  Rune,
  Weapon,
  ArmorItem,
  AbilityScores,
  CombatCalculation,
  CharacterSelectionRef,
  Class,
  Species,
} from "@/shared/types";
import type { StandaloneShieldItem } from "../../data/shield.data";
import { calculateCombat } from "../../utils/combat.calculator";
import { getActiveTrinketEffect } from "../../utils/trinket.utils";
import { fitArmorRarityProperties } from "../../utils/armor-rarity-properties.utils";
import { collectAmellwindAcBonuses } from "../../utils/amellwind-ac-bonuses.utils";
import { getCharacterAcBreakdown } from "../../utils/character-armor-class";
import { abilityModifiersFromScores } from "../../utils/effective-ability-scores";
import {
  getRuneSlotsForRarity,
  getWeaponExtraSlots,
  makeWeaponSlot,
  makeArmorSlot,
  resizeRunesForRarity,
} from "../../utils/equipment.factory";
import { wouldViolateRule, type RuleViolation } from "@/features/amellwind/runes/utils/build.validation";
import {
  getWeaponShieldAcBonus,
  hasActiveIntegratedShield,
  weaponIncludesShield,
} from "@/features/amellwind/weapons/utils/shield.utils";
import {
  getWeaponGripModeDefinition,
} from "@/features/amellwind/weapons/utils/weapon-mode.utils";
import {
  blocksOffHand,
  canEquipInOffHand,
  getOffHandBlockReason,
  occupiesBothGripSlots,
  isWeaponTwoHanded,
} from "@/features/amellwind/weapons/utils/weapon-hands.utils";
import type { Character } from "../../models/Character";
import {
  isAmellwindWeapon,
  stripRunesFromArmor,
  stripRunesFromWeapon,
} from "../../utils/homebrew-cleanup.utils";

export interface EquipmentSliceInput {
  character: Character;
  /** Base + origin + ASI scores used for AC / DPT modifiers. */
  effectiveAbilities: AbilityScores;
  classRef: CharacterSelectionRef | null;
  speciesRef: CharacterSelectionRef | null;
  classData: Class | null;
  speciesData: Species | null;
  attacksPerTurnOverride: number | null;
  useUnarmedStrike: boolean;
  useAmellwindHomebrew: boolean;
  /** AGMH Artificer: extra material slots on weapon and armor (10/14/18). */
  artificerBonusMaterialSlots: number;
}

/**
 * Snapshot restore: keep the saved slot count when it is larger (Artificer
 * bonus slots are derived from class levels that load in the same tick).
 */
function withSavedRuneSlots<T extends { runeSlots: number; runes: (Rune | null)[] }>(
  equipped: T,
  savedRuneSlots: number | undefined,
): T {
  if (!savedRuneSlots || savedRuneSlots <= equipped.runeSlots) return equipped;
  const runes = [...equipped.runes];
  while (runes.length < savedRuneSlots) runes.push(null);
  return { ...equipped, runeSlots: savedRuneSlots, runes };
}

export function useEquipmentSlice({
  character,
  effectiveAbilities,
  classRef,
  speciesRef,
  classData,
  speciesData,
  attacksPerTurnOverride,
  useUnarmedStrike,
  useAmellwindHomebrew,
  artificerBonusMaterialSlots,
}: EquipmentSliceInput) {
  const bonusSlotsRef = useRef(artificerBonusMaterialSlots);
  bonusSlotsRef.current = artificerBonusMaterialSlots;

  // ─── Equipped slots ─────────────────────────────────────────────────────────

  const [mainHand, setMainHandState] = useState<EquippedWeapon | null>(null);
  // Latest queued main-hand value: setters called in the same tick (snapshot
  // restore runs equipWeapon → setWeaponMode → off-hand/shield) must see it,
  // not the value captured by the render that created them.
  const mainHandRef = useRef<EquippedWeapon | null>(null);
  const setMainHand = useCallback((next: SetStateAction<EquippedWeapon | null>) => {
    const value = typeof next === "function" ? next(mainHandRef.current) : next;
    mainHandRef.current = value;
    setMainHandState(value);
  }, []);
  const [offHand, setOffHand] = useState<EquippedWeapon | null>(null);
  const [equippedShield, setEquippedShield] =
    useState<StandaloneShieldItem | null>(null);
  const [armor, setArmor] = useState<EquippedArmor | null>(null);
  const [trinket1, setTrinket1] = useState<EquippedTrinket | null>(null);
  const [trinket2, setTrinket2] = useState<EquippedTrinket | null>(null);

  // ─── Equip / unequip / rarity / grip mode ───────────────────────────────────

  const equipWeapon = useCallback(
    (
      slot: "mainHand" | "offHand",
      weapon: Weapon,
      rarity: string,
      savedRuneSlots?: number,
    ) => {
      const equipped = withSavedRuneSlots(
        makeWeaponSlot(weapon, rarity, bonusSlotsRef.current),
        savedRuneSlots,
      );
      if (slot === "mainHand") {
        setMainHand(equipped);
        if (
          isWeaponTwoHanded(equipped) ||
          weaponIncludesShield(weapon) ||
          occupiesBothGripSlots(weapon)
        ) {
          setOffHand(null);
          setEquippedShield(null);
        }
      } else if (
        !hasActiveIntegratedShield(mainHandRef.current) &&
        !blocksOffHand(mainHandRef.current) &&
        canEquipInOffHand(weapon)
      ) {
        setEquippedShield(null);
        setOffHand(equipped);
      }
    },
    [setMainHand],
  );

  const unequipWeapon = useCallback((slot: "mainHand" | "offHand") => {
    if (slot === "mainHand") setMainHand(null);
    else {
      setOffHand(null);
      setEquippedShield(null);
    }
  }, [setMainHand]);

  const setWeaponRarity = useCallback((slot: "mainHand" | "offHand", rarity: string) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...resizeRunesForRarity(
          prev.runes,
          rarity,
          bonusSlotsRef.current + getWeaponExtraSlots(prev.weapon),
        ),
      };
    });
  }, [setMainHand]);

  const setWeaponMode = useCallback(
    (slot: "mainHand" | "offHand", modeIndex: number) => {
      if (slot === "offHand") {
        setOffHand((prev) => (prev ? { ...prev, activeModeIndex: modeIndex } : prev));
        return;
      }
      const current = mainHandRef.current;
      if (!current) return;

      const mode = getWeaponGripModeDefinition(current.weapon)?.modes[modeIndex];
      setMainHand({ ...current, activeModeIndex: modeIndex });

      if (mode && (mode.isTwoHanded || mode.blocksOffHand)) {
        setOffHand(null);
        setEquippedShield(null);
      }
    },
    [setMainHand],
  );

  // AGMH: shields only exist as part of a weapon that already provides one.
  const equipShield = useCallback(
    (shield: StandaloneShieldItem) => {
      if (useAmellwindHomebrew) return;
      const current = mainHandRef.current;
      if (hasActiveIntegratedShield(current) || blocksOffHand(current)) return;
      setOffHand(null);
      setEquippedShield(shield);
    },
    [useAmellwindHomebrew],
  );

  useEffect(() => {
    if (useAmellwindHomebrew) setEquippedShield(null);
  }, [useAmellwindHomebrew]);

  const unequipShield = useCallback(() => setEquippedShield(null), []);

  const equipArmor = useCallback(
    (armorItem: ArmorItem) => {
      setArmor(
        makeArmorSlot(
          armorItem,
          armorItem.rarity,
          useAmellwindHomebrew,
          bonusSlotsRef.current,
        ),
      );
    },
    [useAmellwindHomebrew],
  );

  const unequipArmor = useCallback(() => setArmor(null), []);

  const setArmorRarity = useCallback(
    (rarity: string, savedRuneSlots?: number) => {
      setArmor((prev) => {
        if (!prev) return prev;
        return withSavedRuneSlots(
          {
            ...prev,
            ...resizeRunesForRarity(prev.runes, rarity, bonusSlotsRef.current),
            rarityProperties: fitArmorRarityProperties(
              prev.rarityProperties,
              rarity,
            ),
          },
          savedRuneSlots,
        );
      });
    },
    [],
  );

  /** AGMH: property gained at the index-th Rare+ rarity step. */
  const setArmorRarityProperty = useCallback(
    (index: number, property: ArmorRarityProperty | null) => {
      setArmor((prev) => {
        if (!prev) return prev;
        const next = fitArmorRarityProperties(
          prev.rarityProperties,
          prev.rarity,
        );
        if (index < 0 || index >= next.length) return prev;
        next[index] = property;
        return { ...prev, rarityProperties: next };
      });
    },
    [],
  );

  // Level / class changes move the Artificer breakpoints: resize equipped
  // Amellwind gear, keeping the materials that still fit.
  useEffect(() => {
    const resizeWeapon = (prev: EquippedWeapon | null) => {
      if (!prev || prev.weapon.contentSource === "dnd") return prev;
      const bonus = artificerBonusMaterialSlots + getWeaponExtraSlots(prev.weapon);
      const expected = getRuneSlotsForRarity(prev.rarity, bonus);
      if (prev.runeSlots === expected) return prev;
      return {
        ...prev,
        ...resizeRunesForRarity(prev.runes, prev.rarity, bonus),
      };
    };
    setMainHand(resizeWeapon);
    setOffHand(resizeWeapon);
    if (!useAmellwindHomebrew) return;
    setArmor((prev) => {
      if (!prev) return prev;
      const expected = getRuneSlotsForRarity(
        prev.rarity,
        artificerBonusMaterialSlots,
      );
      if (prev.runeSlots === expected) return prev;
      return {
        ...prev,
        ...resizeRunesForRarity(
          prev.runes,
          prev.rarity,
          artificerBonusMaterialSlots,
        ),
      };
    });
  }, [artificerBonusMaterialSlots, useAmellwindHomebrew, setMainHand]);

  const equipTrinket = useCallback(
    (slot: "trinket1" | "trinket2", name: string) => {
      const other = slot === "trinket1" ? trinket2 : trinket1;
      const current = slot === "trinket1" ? trinket1 : trinket2;
      // Keep the active trinket; the first one equipped becomes active.
      const active = current?.active ?? !other?.active;
      const trinket: EquippedTrinket = { name, rune: null, active };
      if (slot === "trinket1") setTrinket1(trinket);
      else setTrinket2(trinket);
    },
    [trinket1, trinket2],
  );

  const unequipTrinket = useCallback((slot: "trinket1" | "trinket2") => {
    const otherSetter = slot === "trinket1" ? setTrinket2 : setTrinket1;
    if (slot === "trinket1") setTrinket1(null);
    else setTrinket2(null);
    // The remaining trinket becomes the active one.
    otherSetter((prev) => (prev ? { ...prev, active: true } : prev));
  }, []);

  /** AGMH: swap which trinket's material is active (an action in play). */
  const setActiveTrinket = useCallback((slot: "trinket1" | "trinket2") => {
    setTrinket1((prev) => (prev ? { ...prev, active: slot === "trinket1" } : prev));
    setTrinket2((prev) => (prev ? { ...prev, active: slot === "trinket2" } : prev));
  }, []);

  const clearEquipment = useCallback(() => {
    setMainHand(null);
    setOffHand(null);
    setEquippedShield(null);
    setArmor(null);
    setTrinket1(null);
    setTrinket2(null);
  }, [setMainHand]);

  // ─── Rune assignment ────────────────────────────────────────────────────────

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

  const assignTrinketRune = useCallback(
    (
      slot: "trinket1" | "trinket2",
      rune: Rune,
      materialEffectKind?: "weapon" | "armor",
    ) => {
      const setter = slot === "trinket1" ? setTrinket1 : setTrinket2;
      setter((prev) =>
        prev
          ? {
              ...prev,
              rune,
              runeMaterialEffect: materialEffectKind ?? prev.runeMaterialEffect,
            }
          : prev,
      );
    },
    [],
  );

  const removeTrinketRune = useCallback((slot: "trinket1" | "trinket2") => {
    const setter = slot === "trinket1" ? setTrinket1 : setTrinket2;
    setter((prev) => (prev ? { ...prev, rune: null } : prev));
  }, []);

  // ─── Derived AC / DPT / grip flags ──────────────────────────────────────────

  const isTwoHanded = isWeaponTwoHanded(mainHand);
  const isOffHandBlocked = blocksOffHand(mainHand);
  const offHandBlockReason = getOffHandBlockReason(mainHand);
  const hasIntegratedShield = hasActiveIntegratedShield(mainHand);
  const integratedShieldAcBonus = useMemo(() => {
    if (!hasIntegratedShield || !mainHand) return 0;
    return getWeaponShieldAcBonus(mainHand.weapon, mainHand.rarity);
  }, [hasIntegratedShield, mainHand]);

  const standaloneShieldAcBonus = equippedShield?.acBonus ?? 0;
  const shieldAcBonus = integratedShieldAcBonus + standaloneShieldAcBonus;

  const totalAC = useMemo(() => {
    const modifiers = abilityModifiersFromScores(effectiveAbilities);

    return getCharacterAcBreakdown({
      modifiers,
      level: character.level,
      armor,
      integratedShieldAcBonus,
      standaloneShieldAcBonus,
      classData: null,
      className: classRef?.name,
      subclass: null,
      speciesName: speciesRef?.name,
      extraBonuses: collectAmellwindAcBonuses({
        armor,
        trinket1,
        trinket2,
        useAmellwindHomebrew,
      }),
    }).total;
  }, [
    trinket1,
    trinket2,
    useAmellwindHomebrew,
    armor,
    character.level,
    effectiveAbilities,
    integratedShieldAcBonus,
    standaloneShieldAcBonus,
    classRef?.name,
    speciesRef?.name,
  ]);

  const effectiveAttacksPerTurn = attacksPerTurnOverride ?? character.getAttacksPerTurn();

  const combatCharacter = useMemo(
    () => character.withUpdates({ abilities: effectiveAbilities }),
    [character, effectiveAbilities],
  );

  const combat: CombatCalculation = useMemo(
    () =>
      calculateCombat(
        combatCharacter,
        mainHand,
        offHand,
        effectiveAttacksPerTurn,
        useUnarmedStrike,
        classRef?.name,
        classData,
        speciesData,
        useAmellwindHomebrew,
        getActiveTrinketEffect(trinket1, trinket2, "weapon")?.rune ?? null,
      ),
    [
      combatCharacter,
      mainHand,
      offHand,
      effectiveAttacksPerTurn,
      useUnarmedStrike,
      classRef?.name,
      classData,
      speciesData,
      useAmellwindHomebrew,
      trinket1,
      trinket2,
    ],
  );

  const resetEquipment = useCallback(() => {
    clearEquipment();
  }, [clearEquipment]);

  const clearHomebrewEquipment = useCallback(() => {
    setTrinket1(null);
    setTrinket2(null);
    setMainHand((prev) => {
      if (!prev) return null;
      if (isAmellwindWeapon(prev.weapon)) return null;
      return stripRunesFromWeapon(prev);
    });
    setOffHand((prev) => {
      if (!prev) return null;
      if (isAmellwindWeapon(prev.weapon)) return null;
      return stripRunesFromWeapon(prev);
    });
    setArmor((prev) => (prev ? stripRunesFromArmor(prev) : null));
  }, []);

  return useMemo(
    () => ({
      mainHand,
      offHand,
      armor,
      trinket1,
      trinket2,
      equippedShield,
      effectiveAttacksPerTurn,
      isTwoHanded,
      isOffHandBlocked,
      offHandBlockReason,
      hasIntegratedShield,
      integratedShieldAcBonus,
      standaloneShieldAcBonus,
      shieldAcBonus,
      totalAC,
      combat,
      equipWeapon,
      unequipWeapon,
      setWeaponRarity,
      setWeaponMode,
      equipArmor,
      unequipArmor,
      equipShield,
      unequipShield,
      setArmorRarity,
      setArmorRarityProperty,
      equipTrinket,
      unequipTrinket,
      setActiveTrinket,
      clearEquipment,
      assignWeaponRune,
      removeWeaponRune,
      assignArmorRune,
      removeArmorRune,
      assignTrinketRune,
      removeTrinketRune,
      resetEquipment,
      clearHomebrewEquipment,
    }),
    [
      mainHand,
      offHand,
      armor,
      trinket1,
      trinket2,
      equippedShield,
      effectiveAttacksPerTurn,
      isTwoHanded,
      isOffHandBlocked,
      offHandBlockReason,
      hasIntegratedShield,
      integratedShieldAcBonus,
      standaloneShieldAcBonus,
      shieldAcBonus,
      totalAC,
      combat,
      equipWeapon,
      unequipWeapon,
      setWeaponRarity,
      setWeaponMode,
      equipArmor,
      unequipArmor,
      equipShield,
      unequipShield,
      setArmorRarity,
      setArmorRarityProperty,
      equipTrinket,
      unequipTrinket,
      setActiveTrinket,
      clearEquipment,
      assignWeaponRune,
      removeWeaponRune,
      assignArmorRune,
      removeArmorRune,
      assignTrinketRune,
      removeTrinketRune,
      resetEquipment,
      clearHomebrewEquipment,
    ],
  );
}
