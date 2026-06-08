import { useSyncStartingEquipmentInventory } from "../hooks/useSyncStartingEquipmentInventory";

/** Invisible sync — keeps inventory aligned with class/background selection. */
export function StartingEquipmentInventorySync() {
  useSyncStartingEquipmentInventory();
  return null;
}
