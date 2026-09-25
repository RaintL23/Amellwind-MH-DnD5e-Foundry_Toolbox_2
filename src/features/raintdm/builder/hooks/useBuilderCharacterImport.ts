import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
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

      // Commit the reset (and homebrew toggle) before restoring. Identity
      // loaders are keyed by class/species/background id, so batching the
      // reset with the restore would skip reloading catalog data and grants
      // whenever the imported character shares an id with the current build.
      flushSync(() => {
        builderRef.current.resetBuild();
        builderRef.current.setUseAmellwindHomebrew(
          data.snapshot.useAmellwindHomebrew,
        );
      });

      const autosaveState: BuilderAutosaveState = {
        version: BUILDER_AUTOSAVE_VERSION,
        snapshotVersion: BUILDER_SNAPSHOT_VERSION,
        identity: data.identity,
        core: data.core,
        multiclass: data.multiclass,
        snapshot: data.snapshot,
      };

      const liveBuilder = builderRef.current;
      rehydrateBuilderState(liveBuilder, inventoryRef.current, autosaveState);
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
