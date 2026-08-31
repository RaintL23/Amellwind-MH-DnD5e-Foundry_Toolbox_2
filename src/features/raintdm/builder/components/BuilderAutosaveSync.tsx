import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useCharacterBuilder } from "../context/CharacterBuilderContext";
import { useBuilderInventory } from "../context/BuilderInventoryContext";
import {
  buildBuilderPersistPayload,
  hasBuildContent,
  rehydrateBuilderState,
  type BuilderPersistPayload,
} from "../storage/builder-persist";
import {
  loadBuilderAutosave,
  persistBuilderAutosave,
} from "../storage/builder-autosave.storage";

function originFeatPersistKey(payload: BuilderPersistPayload): string {
  return JSON.stringify({
    species: payload.snapshot.speciesOriginFeat,
    background: payload.snapshot.backgroundOriginFeat,
    optional: payload.snapshot.optionalFeatureOriginFeats,
  });
}

/**
 * Autosaves the active build to localStorage and rehydrates it on mount so the
 * builder survives reloads and browser restarts. Rendered inside the builder
 * route providers only.
 */
export function BuilderAutosaveSync() {
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const hydratedRef = useRef(false);
  const lastWrittenRef = useRef<string | null>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = loadBuilderAutosave();
    if (saved) rehydrateBuilderState(builder, inventory, saved);
    // Rehydrate exactly once on mount; the guard above prevents re-entry.
  }, []);

  const payload = useMemo(
    () => buildBuilderPersistPayload(builder, { items: inventory.items }),
    [builder, inventory.items],
  );
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const flushAutosave = useCallback(() => {
    const latest = payloadRef.current;
    if (!hasBuildContent(latest)) return;
    const serialized = JSON.stringify(latest);
    if (serialized === lastWrittenRef.current) return;
    lastWrittenRef.current = serialized;
    persistBuilderAutosave(latest);
  }, []);

  const debounced = useDebouncedValue(payload, 500);
  const originFeatKey = originFeatPersistKey(payload);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!hasBuildContent(debounced)) return;
    const serialized = JSON.stringify(debounced);
    if (serialized === lastWrittenRef.current) return;
    lastWrittenRef.current = serialized;
    persistBuilderAutosave(debounced);
  }, [debounced]);

  // Origin feats are often the last pick before closing the tab — persist immediately.
  useEffect(() => {
    if (!hydratedRef.current) return;
    flushAutosave();
  }, [originFeatKey, flushAutosave]);

  useEffect(() => {
    const onPageHide = () => flushAutosave();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      flushAutosave();
    };
  }, [flushAutosave]);

  return null;
}
