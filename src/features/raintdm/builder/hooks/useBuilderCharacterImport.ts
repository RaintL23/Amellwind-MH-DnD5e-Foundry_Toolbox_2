import { useCallback, useRef, useState } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { parseBuilderCharacter } from "../builder-json";
import { replaceBuilderBuild } from "../storage/builder-persist";

export interface BuilderCharacterImportSummary {
  name: string;
  className: string | null;
  speciesName: string | null;
  level: number;
  restoredArt: boolean;
}

export function useBuilderCharacterImport() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  // Setters close over render-time state; the import must call the ones bound
  // to the post-reset render, not the ones captured before it.
  const builderRef = useRef(builder);
  builderRef.current = builder;
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BuilderCharacterImportSummary | null>(null);

  const importFromFile = useCallback(async (file: File) => {
    setImporting(true);
    setError(null);
    setSummary(null);

    try {
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text) as unknown;
      } catch {
        setError("Could not parse file: invalid JSON.");
        return;
      }

      const result = parseBuilderCharacter(raw);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const { data } = result;

      replaceBuilderBuild(
        () => builderRef.current,
        () => inventoryRef.current,
        {
          identity: data.identity,
          core: data.core,
          multiclass: data.multiclass,
          snapshot: data.snapshot,
        },
      );

      const liveBuilder = builderRef.current;
      if (data.art) {
        liveBuilder.setPortraitImage(data.art.portrait);
        liveBuilder.setTokenImage(data.art.token);
      }

      setSummary({
        name: data.core.name,
        className: data.identity.class?.name ?? null,
        speciesName: data.identity.species?.name ?? null,
        level: data.core.level,
        restoredArt: Boolean(data.art),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setImporting(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setError(null);
    setSummary(null);
  }, []);

  return { importFromFile, importing, error, summary, clearResult };
}
