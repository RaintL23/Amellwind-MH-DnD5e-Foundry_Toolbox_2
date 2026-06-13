import { useEffect } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { useSelectedClass } from "../hooks/useSelectedClass";

/** Keeps inventory weapon/armor catalogs aligned with builder mode and class source. */
export function InventoryCatalogSync() {
  const { useAmellwindHomebrew } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const { syncEquipmentCatalogs } = useBuilderInventory();
  const prefer2024 = classData?.source === "XPHB";

  useEffect(() => {
    syncEquipmentCatalogs(useAmellwindHomebrew, prefer2024);
  }, [useAmellwindHomebrew, prefer2024, syncEquipmentCatalogs]);

  return null;
}
