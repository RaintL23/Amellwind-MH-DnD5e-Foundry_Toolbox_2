import { useState, useCallback } from "react";
import {
  EquipmentSlotType,
  CharacterIdentitySlot,
} from "@/shared/types";

export type PaperDollSelection = EquipmentSlotType | CharacterIdentitySlot | null;

export function usePaperDollSelection() {
  const [selectedSlot, setSelectedSlot] = useState<PaperDollSelection>(null);

  const selectSlot = useCallback((slot: PaperDollSelection) => {
    setSelectedSlot(slot);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  return {
    selectedSlot,
    selectSlot,
    clearSelection,
    setSelectedSlot,
  };
}
