import { useMemo } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import {
  EquipmentSlotType,
  EquippedWeapon,
  EquippedArmor,
  EquippedTrinket,
  Rune,
} from "@/shared/types";

export type EquippedSlotData =
  | { kind: "weapon"; item: EquippedWeapon; name: string; runes: (Rune | null)[] }
  | { kind: "armor"; item: EquippedArmor; name: string; runes: (Rune | null)[] }
  | { kind: "trinket"; item: EquippedTrinket; name: string; runes: (Rune | null)[] }
  | { kind: "empty" };

export function useEquippedSlot(slot: EquipmentSlotType): EquippedSlotData {
  const { mainHand, offHand, armor, trinket1, trinket2 } = useCharacterBuilder();

  return useMemo(() => {
    if (slot === "mainHand") {
      if (!mainHand) return { kind: "empty" };
      return {
        kind: "weapon",
        item: mainHand,
        name: mainHand.weapon.name,
        runes: mainHand.runes,
      };
    }
    if (slot === "offHand") {
      if (!offHand) return { kind: "empty" };
      return {
        kind: "weapon",
        item: offHand,
        name: offHand.weapon.name,
        runes: offHand.runes,
      };
    }
    if (slot === "armor") {
      if (!armor) return { kind: "empty" };
      return {
        kind: "armor",
        item: armor,
        name: armor.armor.name,
        runes: armor.runes,
      };
    }
    const trinket = slot === "trinket1" ? trinket1 : trinket2;
    if (!trinket) return { kind: "empty" };
    return {
      kind: "trinket",
      item: trinket,
      name: trinket.name,
      runes: [trinket.rune],
    };
  }, [slot, mainHand, offHand, armor, trinket1, trinket2]);
}

export function collectAssignedRuneKeys(
  mainHand: EquippedWeapon | null,
  offHand: EquippedWeapon | null,
  armor: EquippedArmor | null,
  trinket1: EquippedTrinket | null,
  trinket2: EquippedTrinket | null,
): Set<string> {
  const keys = new Set<string>();
  const all: (Rune | null)[] = [
    ...(mainHand?.runes ?? []),
    ...(offHand?.runes ?? []),
    ...(armor?.runes ?? []),
    trinket1?.rune ?? null,
    trinket2?.rune ?? null,
  ];
  for (const r of all) {
    if (r) keys.add(`${r.name}||${r.monsterName}`);
  }
  return keys;
}
