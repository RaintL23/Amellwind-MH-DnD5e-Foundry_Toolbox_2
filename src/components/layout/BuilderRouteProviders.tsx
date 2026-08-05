import type { ReactNode } from "react";
import { SpellcastingProvider } from "@/features/builder/context/SpellcastingContext";
import { StartingEquipmentInventorySync } from "@/features/builder/components/StartingEquipmentInventorySync";
import { InventoryCatalogSync } from "@/features/builder/components/InventoryCatalogSync";
import { BuilderAutosaveSync } from "@/features/builder/components/BuilderAutosaveSync";

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
