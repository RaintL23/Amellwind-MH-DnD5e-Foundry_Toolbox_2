import { useEffect, useMemo, useRef } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useBuilderCharacterJson } from "../hooks/useBuilderCharacterJson";
import {
  builderBuildKey,
  persistBuilderExportCache,
} from "../storage/builder-export-cache.storage";

const DEBOUNCE_MS = 800;

/**
 * Keeps the export-only blocks (provenance / derived / meta) of the live build
 * in localStorage for "Load from Builder". Mounted inside the Builder page,
 * where completeness and spellcasting context are available.
 */
export function BuilderExportCacheSync() {
  const buildJson = useBuilderCharacterJson();
  // Wrapped: useState would treat a bare function as an initializer/updater.
  const current = useMemo(() => ({ buildJson }), [buildJson]);
  const debounced = useDebouncedValue(current, DEBOUNCE_MS);
  const latestRef = useRef(buildJson);
  latestRef.current = buildJson;

  useEffect(() => {
    writeCache(debounced.buildJson);
  }, [debounced]);

  // Flush on leave: the roster's "Load from Builder" runs after navigation.
  useEffect(() => () => writeCache(latestRef.current), []);

  return null;
}

function writeCache(buildJson: ReturnType<typeof useBuilderCharacterJson>): void {
  try {
    const json = buildJson();
    if (!json.provenance || !json.derived || !json.meta) return;
    persistBuilderExportCache({
      buildKey: builderBuildKey(json),
      provenance: json.provenance,
      derived: json.derived,
      meta: json.meta,
    });
  } catch {
    // Best effort: Load from Builder falls back to compiling without it.
  }
}
