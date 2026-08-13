/**
 * Route-scoped Builder wiring (only `/builder`): character state, spellcasting
 * context, plus autosave / starting-equipment / inventory catalog sync.
 */
import type { ReactNode } from "react";
import { CharacterBuilderProvider } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import { SpellcastingProvider } from "@/features/raintdm/builder/context/SpellcastingContext";
import { StartingEquipmentInventorySync } from "@/features/raintdm/builder/components/StartingEquipmentInventorySync";
import { InventoryCatalogSync } from "@/features/raintdm/builder/components/InventoryCatalogSync";
import { BuilderAutosaveSync } from "@/features/raintdm/builder/components/BuilderAutosaveSync";

export function BuilderRouteProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <CharacterBuilderProvider>
      <SpellcastingProvider>
        <BuilderAutosaveSync />
        <StartingEquipmentInventorySync />
        <InventoryCatalogSync />
        {children}
      </SpellcastingProvider>
    </CharacterBuilderProvider>
  );
}
