import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [hydrationSettled, setHydrationSettled] = useState(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = loadBuilderAutosave();
    if (saved) {
      rehydrateBuilderState(builder, inventory, saved);
      lastWrittenRef.current = JSON.stringify({
        identity: saved.identity,
        core: saved.core,
        multiclass: saved.multiclass,
        snapshot: saved.snapshot,
      });
    }
    // Wait one render so rehydrated state is reflected in the persist payload
    // before any debounced save can overwrite a good autosave with empty state.
    setHydrationSettled(true);
  }, [builder, inventory]);

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
    if (!hydrationSettled) return;
    if (!hasBuildContent(debounced)) return;
    const serialized = JSON.stringify(debounced);
    if (serialized === lastWrittenRef.current) return;
    lastWrittenRef.current = serialized;
    persistBuilderAutosave(debounced);
  }, [debounced, hydrationSettled]);

  // Origin feats are often the last pick before closing the tab — persist immediately.
  useEffect(() => {
    if (!hydrationSettled) return;
    flushAutosave();
  }, [originFeatKey, flushAutosave, hydrationSettled]);

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
