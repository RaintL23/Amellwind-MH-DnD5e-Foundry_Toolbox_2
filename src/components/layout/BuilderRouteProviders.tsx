import type { ReactNode } from "react";
import { SpellcastingProvider } from "@/features/raintdm/builder/context/SpellcastingContext";
import { StartingEquipmentInventorySync } from "@/features/raintdm/builder/components/StartingEquipmentInventorySync";
import { InventoryCatalogSync } from "@/features/raintdm/builder/components/InventoryCatalogSync";
import { BuilderAutosaveSync } from "@/features/raintdm/builder/components/BuilderAutosaveSync";

/** Builder-only sync and spellcasting — avoids running on every app route. */
export function BuilderRouteProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SpellcastingProvider>
      <BuilderAutosaveSync />
      <StartingEquipmentInventorySync />
      <InventoryCatalogSync />
      {children}
    </SpellcastingProvider>
  );
}
