import { useState, useCallback, useMemo } from "react";
import type {
  EquippedWeapon,
  EquippedArmor,
  EquippedTrinket,
  Rune,
  Weapon,
  ArmorItem,
  CombatCalculation,
  CharacterSelectionRef,
  Class,
  Species,
} from "@/shared/types";
import type { StandaloneShieldItem } from "../../data/shield.data";
import { calculateCombat } from "../../utils/combat.calculator";
import { getCharacterAcBreakdown } from "../../utils/character-armor-class";
import {
  makeWeaponSlot,
  makeArmorSlot,
  resizeRunesForRarity,
} from "../../utils/equipment.factory";
import { wouldViolateRule, type RuleViolation } from "@/features/runes/utils/build.validation";
import {
  getWeaponShieldAcBonus,
  hasActiveIntegratedShield,
  weaponIncludesShield,
} from "@/features/weapons/utils/shield.utils";
import {
  blocksOffHand,
  canEquipInOffHand,
  getOffHandBlockReason,
  occupiesBothGripSlots,
  isWeaponTwoHanded,
} from "@/features/weapons/utils/weapon-hands.utils";
import type { Character } from "../../models/Character";

export interface EquipmentSliceInput {
  character: Character;
  classRef: CharacterSelectionRef | null;
  speciesRef: CharacterSelectionRef | null;
  classData: Class | null;
  speciesData: Species | null;
  attacksPerTurnOverride: number | null;
  useUnarmedStrike: boolean;
}

export function useEquipmentSlice({
  character,
  classRef,
  speciesRef,
  classData,
  speciesData,
  attacksPerTurnOverride,
  useUnarmedStrike,
}: EquipmentSliceInput) {
  const [mainHand, setMainHand] = useState<EquippedWeapon | null>(null);
  const [offHand, setOffHand] = useState<EquippedWeapon | null>(null);
  const [equippedShield, setEquippedShield] =
    useState<StandaloneShieldItem | null>(null);
  const [armor, setArmor] = useState<EquippedArmor | null>(null);
  const [trinket1, setTrinket1] = useState<EquippedTrinket | null>(null);
  const [trinket2, setTrinket2] = useState<EquippedTrinket | null>(null);

  const equipWeapon = useCallback(
    (slot: "mainHand" | "offHand", weapon: Weapon, rarity: string) => {
      const equipped = makeWeaponSlot(weapon, rarity);
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
        !hasActiveIntegratedShield(mainHand) &&
        !blocksOffHand(mainHand) &&
        canEquipInOffHand(weapon)
      ) {
        setEquippedShield(null);
        setOffHand(equipped);
      }
    },
    [mainHand],
  );

  const unequipWeapon = useCallback((slot: "mainHand" | "offHand") => {
    if (slot === "mainHand") setMainHand(null);
    else {
      setOffHand(null);
      setEquippedShield(null);
    }
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
    if (slot === "mainHand" && twoHanded) {
      setOffHand(null);
      setEquippedShield(null);
    }
  }, []);

  const equipShield = useCallback(
    (shield: StandaloneShieldItem) => {
      if (hasActiveIntegratedShield(mainHand) || blocksOffHand(mainHand)) return;
      setOffHand(null);
      setEquippedShield(shield);
    },
    [mainHand],
  );

  const unequipShield = useCallback(() => setEquippedShield(null), []);

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

  const clearEquipment = useCallback(() => {
    setMainHand(null);
    setOffHand(null);
    setEquippedShield(null);
    setArmor(null);
    setTrinket1(null);
    setTrinket2(null);
  }, []);

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
    const modifiers = {
      str: character.getModifier("str"),
      dex: character.getModifier("dex"),
      con: character.getModifier("con"),
      int: character.getModifier("int"),
      wis: character.getModifier("wis"),
      cha: character.getModifier("cha"),
    };

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
    }).total;
  }, [
    armor,
    character,
    integratedShieldAcBonus,
    standaloneShieldAcBonus,
    classRef?.name,
    speciesRef?.name,
  ]);

  const effectiveAttacksPerTurn = attacksPerTurnOverride ?? character.getAttacksPerTurn();

  const combat: CombatCalculation = useMemo(
    () =>
      calculateCombat(
        character,
        mainHand,
        offHand,
        effectiveAttacksPerTurn,
        useUnarmedStrike,
        classRef?.name,
        classData,
        speciesData,
      ),
    [
      character,
      mainHand,
      offHand,
      effectiveAttacksPerTurn,
      useUnarmedStrike,
      classRef?.name,
      classData,
      speciesData,
    ],
  );

  const resetEquipment = useCallback(() => {
    clearEquipment();
  }, [clearEquipment]);

  return {
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
    setVersatileMode,
    equipArmor,
    unequipArmor,
    equipShield,
    unequipShield,
    setArmorRarity,
    equipTrinket,
    unequipTrinket,
    clearEquipment,
    assignWeaponRune,
    removeWeaponRune,
    assignArmorRune,
    removeArmorRune,
    assignTrinketRune,
    removeTrinketRune,
    resetEquipment,
  };
}
