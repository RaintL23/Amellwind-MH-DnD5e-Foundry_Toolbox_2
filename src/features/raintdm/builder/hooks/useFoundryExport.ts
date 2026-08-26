import { useCallback, useMemo, useState } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { useSelectedClass, useSelectedSubclass } from "./useBuilderSelections";
import { useSelectedBackground } from "./useSelectedBackground";
import { useCharacterHitPoints } from "./useCharacterHitPoints";
import { useCharacterSpeed } from "./useCharacterSpeed";
import { useSpellcastingContext } from "../context/SpellcastingContext";
import { useSpellCatalog } from "./useSpellCatalog";
import { useEffectiveAbilityScores } from "./useEffectiveAbilityScores";
import {
  exportFoundryActor,
  type ExportFoundryActorContext,
} from "../foundry-export/export-foundry-actor";

export function useFoundryExport() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const backgroundData = useSelectedBackground();
  const hitPoints = useCharacterHitPoints();
  const speed = useCharacterSpeed();
  const { allSpells } = useSpellCatalog();
  const { spellcasting } = useSpellcastingContext();
  const effectiveAbilities = useEffectiveAbilityScores();

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportContext = useMemo<ExportFoundryActorContext>(
    () => ({
      builder,
      inventory,
      classData,
      subclassData,
      backgroundData,
      hitPoints,
      speed,
      spellcasting,
      effectiveAbilities,
      allSpells,
    }),
    [
      allSpells,
      backgroundData,
      builder,
      classData,
      effectiveAbilities,
      hitPoints,
      inventory,
      speed,
      spellcasting,
      subclassData,
    ],
  );

  const exportFoundry = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      await exportFoundryActor(exportContext);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Foundry export failed");
    } finally {
      setExporting(false);
    }
  }, [exportContext]);

  return { exportFoundry, exporting, error };
}
