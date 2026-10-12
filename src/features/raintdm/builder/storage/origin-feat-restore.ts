/**
 * Pending origin-feat re-apply shared by every restore path (autosave
 * rehydrate, Builder JSON import, Undo). Species/background origin-feat grant
 * loaders are async and may clear the restored pick; `BuilderAutosaveSync`
 * re-applies it whenever grants are ready and the slot is empty, clears the
 * pending entry once a loader cycle finished with the pick in place (or it
 * expires), and skips autosave writes of an empty slot meanwhile.
 *
 * Module-level because the Builder is a single route-scoped instance.
 */
import type { BuilderFeatSelection } from "@/shared/types";

export interface PendingOriginFeatRestore {
  species: BuilderFeatSelection | null;
  background: BuilderFeatSelection | null;
  /** Set once grant loaders were observed loading after the restore. */
  sawLoading: boolean;
  /** Re-apply attempts left (bounds a loader that keeps clearing the slot). */
  attemptsLeft: number;
  /** Safety valve so a loader that never cycles cannot block autosave forever. */
  expiresAt: number;
}

const RESTORE_TIMEOUT_MS = 15_000;

let pending: PendingOriginFeatRestore | null = null;

export function scheduleOriginFeatRestore(snapshot: {
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
}): void {
  pending =
    snapshot.speciesOriginFeat || snapshot.backgroundOriginFeat
      ? {
          species: snapshot.speciesOriginFeat,
          background: snapshot.backgroundOriginFeat,
          sawLoading: false,
          attemptsLeft: 3,
          expiresAt: Date.now() + RESTORE_TIMEOUT_MS,
        }
      : null;
}

/** Current pending restore, or null (expired entries are dropped). */
export function getPendingOriginFeatRestore(): PendingOriginFeatRestore | null {
  if (pending && Date.now() > pending.expiresAt) pending = null;
  return pending;
}

export function clearPendingOriginFeatRestore(): void {
  pending = null;
}
