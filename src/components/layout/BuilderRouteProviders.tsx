import type { ReactNode } from "react";
import { SpellcastingProvider } from "@/features/raintdm/builder/context/SpellcastingContext";
import { StartingEquipmentInventorySync } from "@/features/raintdm/builder/components/StartingEquipmentInventorySync";
import { InventoryCatalogSync } from "@/features/raintdm/builder/components/InventoryCatalogSync";
import { BuilderAutosaveSync } from "@/features/raintdm/builder/components/BuilderAutosaveSync";

/**
 * Route-scoped Builder wiring (only `/builder`): spellcasting context plus
 * autosave / starting-equipment / inventory catalog sync. Avoids running on
 * every app route; CharacterBuilderProvider itself still lives in MainLayout.
 */
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
