import { useCallback, useRef, useState } from "react";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import { parseBuilderCharacter } from "../builder-json";
import { prepareBuilderCharacterImport } from "../builder-json/prepare-builder-character-import";
import { replaceBuilderBuild } from "../storage/builder-persist";
import { showBuilderJsonImportToast } from "../utils/builder-json-import-toast";

export interface BuilderCharacterImportSummary {
  name: string;
  className: string | null;
  speciesName: string | null;
  level: number;
  restoredArt: boolean;
  /** Envelope version the file was upgraded from (null when current). */
  migratedFrom: number | null;
  /** Repairs and catalog re-links applied while importing. */
  warnings: string[];
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

      const prepared = await prepareBuilderCharacterImport(result.data);
      const { data } = prepared;

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

      const nextSummary: BuilderCharacterImportSummary = {
        name: data.core.name,
        className: data.identity.class?.name ?? null,
        speciesName: data.identity.species?.name ?? null,
        level: data.core.level,
        restoredArt: Boolean(data.art),
        migratedFrom: result.migratedFrom,
        warnings: [...result.warnings, ...prepared.warnings],
      };
      setSummary(nextSummary);
      // Toast from here: the welcome card that may trigger the import unmounts
      // as soon as the build starts.
      showBuilderJsonImportToast(
        `Loaded ${nextSummary.name}${nextSummary.className ? ` · ${nextSummary.className}` : ""} · Lv ${nextSummary.level}`,
        nextSummary,
      );
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
