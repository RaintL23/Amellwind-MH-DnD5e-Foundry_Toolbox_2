import { useCallback, useState } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { useSpellcastingContext } from "../context/SpellcastingContext";
import { useEffectiveAbilityScores } from "./useEffectiveAbilityScores";
import {
  buildBuilderCharacterJson,
  buildCharacterProvenance,
  downloadBuilderCharacterJson,
} from "../builder-json";

export function useBuilderCharacterExport() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const effectiveAbilities = useEffectiveAbilityScores();
  const { bonusCantripPools, optionalFeatureSpellGrants } = useSpellcastingContext();
  const [error, setError] = useState<string | null>(null);

  const exportCharacter = useCallback(() => {
    setError(null);
    try {
      const provenance = buildCharacterProvenance({
        builder,
        effectiveAbilities,
        bonusSpellPools: bonusCantripPools,
        optionalFeatureSpellGrants,
      });
      const data = buildBuilderCharacterJson(
        builder,
        { items: inventory.items },
        provenance,
      );
      downloadBuilderCharacterJson(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export Builder JSON.",
      );
    }
  }, [
    builder,
    inventory.items,
    effectiveAbilities,
    bonusCantripPools,
    optionalFeatureSpellGrants,
  ]);

  return { exportCharacter, error };
}
