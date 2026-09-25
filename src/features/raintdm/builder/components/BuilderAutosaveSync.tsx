import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BuilderFeatSelection } from "@/shared/types";
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

interface PendingOriginFeatRestore {
  species: BuilderFeatSelection | null;
  background: BuilderFeatSelection | null;
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
  const pendingOriginFeatRestoreRef = useRef<PendingOriginFeatRestore | null>(
    null,
  );
  const [hydrationSettled, setHydrationSettled] = useState(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = loadBuilderAutosave();
    if (saved) {
      // Keep a copy so we can re-apply after async origin-feat grant loaders
      // finish — those loaders historically raced rehydrate and wiped the pick,
      // then autosave persisted the empty slot.
      pendingOriginFeatRestoreRef.current = {
        species: saved.snapshot.speciesOriginFeat,
        background: saved.snapshot.backgroundOriginFeat,
      };
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

  // Re-apply saved origin feats once grants settle (covers loader races on remount).
  useEffect(() => {
    if (!hydrationSettled) return;
    if (!builder.originFeatGrantsReady) return;

    const pending = pendingOriginFeatRestoreRef.current;
    if (!pending) return;
    pendingOriginFeatRestoreRef.current = null;

    const pendingFeat = pending.species ?? pending.background;
    if (!pendingFeat) return;

    const alreadyPresent =
      !!builder.speciesOriginFeat || !!builder.backgroundOriginFeat;
    if (alreadyPresent) return;

    if (pending.species) {
      builder.setSpeciesOriginFeat(pending.species);
    } else if (pending.background) {
      builder.setBackgroundOriginFeat(pending.background);
    }
  }, [
    hydrationSettled,
    builder.originFeatGrantsReady,
    builder.speciesOriginFeat,
    builder.backgroundOriginFeat,
    builder.setSpeciesOriginFeat,
    builder.setBackgroundOriginFeat,
  ]);

  const payload = useMemo(
    () => buildBuilderPersistPayload(builder, { items: inventory.items }),
    [builder, inventory.items],
  );
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const flushAutosave = useCallback(() => {
    const latest = payloadRef.current;
    if (!hasBuildContent(latest)) return;

    // While a remount restore is pending, do not persist an empty origin-feat
    // slot (grant loaders may have raced). Other fields can still wait for the
    // restore effect; the on-disk autosave still holds the good snapshot.
    const pending = pendingOriginFeatRestoreRef.current;
    if (pending && (pending.species || pending.background)) {
      const liveHasOriginFeat =
        !!latest.snapshot.speciesOriginFeat ||
        !!latest.snapshot.backgroundOriginFeat;
      if (!liveHasOriginFeat) return;
    }

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

    const pending = pendingOriginFeatRestoreRef.current;
    if (pending && (pending.species || pending.background)) {
      const liveHasOriginFeat =
        !!debounced.snapshot.speciesOriginFeat ||
        !!debounced.snapshot.backgroundOriginFeat;
      if (!liveHasOriginFeat) return;
    }

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
