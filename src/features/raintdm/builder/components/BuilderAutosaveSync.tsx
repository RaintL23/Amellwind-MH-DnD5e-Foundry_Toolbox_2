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
import { consumeBuilderArtHandoff } from "../storage/builder-art-handoff";
import { collectBuildSources } from "../builder-json/builder-character-sources";
import { ensureBuildUaSourcesLoaded } from "../builder-json/prepare-builder-character-import";
import {
  clearPendingOriginFeatRestore,
  getPendingOriginFeatRestore,
  scheduleOriginFeatRestore,
} from "../storage/origin-feat-restore";

function originFeatPersistKey(payload: BuilderPersistPayload): string {
  return JSON.stringify({
    species: payload.snapshot.speciesOriginFeat,
    background: payload.snapshot.backgroundOriginFeat,
    optional: payload.snapshot.optionalFeatureOriginFeats,
  });
}

/** True while a restored origin feat is pending and the live slot is empty. */
function blocksEmptyOriginFeatWrite(payload: BuilderPersistPayload): boolean {
  const pending = getPendingOriginFeatRestore();
  if (!pending) return false;
  return !payload.snapshot.speciesOriginFeat && !payload.snapshot.backgroundOriginFeat;
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
  const builderRef = useRef(builder);
  builderRef.current = builder;
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = loadBuilderAutosave();
    if (!saved) {
      setHydrationSettled(true);
      return;
    }
    // UA / brew catalogs load on demand: without them a saved UA subclass
    // (e.g. Hexblade UA) does not resolve and the stale-ref guards drop it.
    // No cancel flag: hydratedRef blocks the StrictMode re-run, so this pass
    // must finish.
    void ensureBuildUaSourcesLoaded(collectBuildSources(saved))
      .catch(() => {
        /* restore anyway; refs that need the missing catalog are dropped */
      })
      .then(() => {
        const liveBuilder = builderRef.current;
        // Re-applied after async origin-feat grant loaders finish — those
        // loaders historically raced rehydrate and wiped the pick, then autosave
        // persisted the empty slot. Import and Undo schedule the same restore.
        scheduleOriginFeatRestore(saved.snapshot);
        rehydrateBuilderState(liveBuilder, inventoryRef.current, saved);
        // Art is not autosaved; Edit in Builder hands it off in memory.
        const art = consumeBuilderArtHandoff();
        if (art) {
          liveBuilder.setPortraitImage(art.portrait);
          liveBuilder.setTokenImage(art.token);
        }
        lastWrittenRef.current = JSON.stringify({
          identity: saved.identity,
          core: saved.core,
          multiclass: saved.multiclass,
          snapshot: saved.snapshot,
        });
        // Wait one render so rehydrated state is reflected in the persist payload
        // before any debounced save can overwrite a good autosave with empty state.
        setHydrationSettled(true);
      });
  }, []);

  // Re-apply restored origin feats until a grant-loader cycle settles with the
  // pick in place (autosave remount, Builder JSON import, Undo).
  useEffect(() => {
    if (!hydrationSettled) return;
    const pending = getPendingOriginFeatRestore();
    if (!pending) return;
    if (!builder.originFeatGrantsReady) {
      pending.sawLoading = true;
      return;
    }

    const alreadyPresent =
      !!builder.speciesOriginFeat || !!builder.backgroundOriginFeat;
    if (alreadyPresent) {
      // A "ready" flag seen before any loading is stale (loaders flip it off
      // after this child effect runs): keep watching until a cycle completes.
      if (pending.sawLoading) clearPendingOriginFeatRestore();
      return;
    }
    if (pending.attemptsLeft <= 0) {
      clearPendingOriginFeatRestore();
      return;
    }
    pending.attemptsLeft -= 1;

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

    // While a restore is pending, do not persist an empty origin-feat slot
    // (grant loaders may have raced). The on-disk autosave keeps the good one.
    if (blocksEmptyOriginFeatWrite(latest)) return;

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

    if (blocksEmptyOriginFeatWrite(debounced)) return;

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
