import { useState, useCallback } from "react";
import {
  EquipmentSlotType,
  CharacterIdentitySlot,
} from "@/shared/types";

export type PaperDollSelection = EquipmentSlotType | CharacterIdentitySlot | null;

export function usePaperDollSelection() {
  const [pickerSlot, setPickerSlot] = useState<EquipmentSlotType | null>(null);
  const [identityPicker, setIdentityPicker] = useState<
    "species" | "background" | null
  >(null);
  const [selectedSlot, setSelectedSlot] = useState<PaperDollSelection>(null);

  const openEquipmentPicker = useCallback((slot: EquipmentSlotType) => {
    setPickerSlot(slot);
  }, []);

  const closeEquipmentPicker = useCallback(() => {
    setPickerSlot(null);
  }, []);

  const openIdentityPicker = useCallback((slot: "species" | "background") => {
    setIdentityPicker(slot);
  }, []);

  const closeIdentityPicker = useCallback(() => {
    setIdentityPicker(null);
  }, []);

  const selectSlot = useCallback((slot: PaperDollSelection) => {
    setSelectedSlot(slot);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  return {
    pickerSlot,
    identityPicker,
    selectedSlot,
    openEquipmentPicker,
    closeEquipmentPicker,
    openIdentityPicker,
    closeIdentityPicker,
    selectSlot,
    clearSelection,
    setSelectedSlot,
  };
}
