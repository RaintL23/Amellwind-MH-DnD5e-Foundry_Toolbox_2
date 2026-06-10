import { useMemo } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useSelectedClass } from "./useSelectedClass";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import {
  type RuneCompatibilityContext,
  isCharacterSpellcaster,
  getWeaponTypeTagsForWeapon,
} from "@/features/runes/utils/rune-compatibility.utils";
import type { EquippedSlotData } from "./useEquippedSlot";

export function useRuneCompatibilityContext(equipped: EquippedSlotData): RuneCompatibilityContext {
  const { class: classRef, subclass } = useCharacterBuilder();
  const { classData } = useSelectedClass();

  const subclassData = useMemo(() => {
    if (!classData || !subclass) return null;
    return subclassesForClassVariant(classData).find((sc) => sc.id === subclass.id) ?? null;
  }, [classData, subclass]);

  return useMemo(() => {
    const className = classRef?.name ?? null;
    const isSpellcaster = isCharacterSpellcaster(classData, subclassData);

    if (equipped.kind === "weapon") {
      const weapon = equipped.item.weapon;
      return {
        className,
        isSpellcaster,
        weaponName: weapon.name,
        weaponTypeTags: getWeaponTypeTagsForWeapon(weapon),
        slotKind: "weapon",
      };
    }

    if (equipped.kind === "armor") {
      return {
        className,
        isSpellcaster,
        weaponName: null,
        weaponTypeTags: [],
        slotKind: "armor",
      };
    }

    if (equipped.kind === "trinket") {
      return {
        className,
        isSpellcaster,
        weaponName: null,
        weaponTypeTags: [],
        slotKind: "trinket",
      };
    }

    return {
      className,
      isSpellcaster,
      weaponName: null,
      weaponTypeTags: [],
      slotKind: "armor",
    };
  }, [classRef, classData, subclassData, equipped]);
}
