import { useCallback, useState } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { parseBuilderCharacter } from "../builder-json";
import { rehydrateBuilderState } from "../storage/builder-persist";
import {
  BUILDER_AUTOSAVE_VERSION,
  type BuilderAutosaveState,
} from "../storage/builder-autosave.storage";
import { BUILDER_SNAPSHOT_VERSION } from "../foundry-export/builder-snapshot";

export interface BuilderCharacterImportSummary {
  name: string;
  className: string | null;
  speciesName: string | null;
  level: number;
}

export function useBuilderCharacterImport() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BuilderCharacterImportSummary | null>(null);

  const importFromFile = useCallback(
    async (file: File) => {
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

        // Reset first so nothing from the previous build lingers.
        builder.resetBuild();

        // Wrap the envelope into the autosave shape that rehydrateBuilderState expects.
        const autosaveState: BuilderAutosaveState = {
          version: BUILDER_AUTOSAVE_VERSION,
          snapshotVersion: BUILDER_SNAPSHOT_VERSION,
          identity: data.identity,
          core: data.core,
          multiclass: data.multiclass,
          snapshot: data.snapshot,
        };

        rehydrateBuilderState(builder, inventory, autosaveState);

        setSummary({
          name: data.core.name,
          className: data.identity.class?.name ?? null,
          speciesName: data.identity.species?.name ?? null,
          level: data.core.level,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      } finally {
        setImporting(false);
      }
    },
    [builder, inventory],
  );

  const clearResult = useCallback(() => {
    setError(null);
    setSummary(null);
  }, []);

  return { importFromFile, importing, error, summary, clearResult };
}
