import { useCallback, useState } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import {
  buildBuilderCharacterJson,
  downloadBuilderCharacterJson,
} from "../builder-json";

export function useBuilderCharacterExport() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const [error, setError] = useState<string | null>(null);

  const exportCharacter = useCallback(() => {
    setError(null);
    try {
      const data = buildBuilderCharacterJson(builder, { items: inventory.items });
      downloadBuilderCharacterJson(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export Builder JSON.",
      );
    }
  }, [builder, inventory.items]);

  return { exportCharacter, error };
}
