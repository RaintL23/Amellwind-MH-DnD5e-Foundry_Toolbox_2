import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PlayCharacterCompiled,
  PlayCharacterRecord,
  PlayRollEntry,
} from "../utils/play-character.types";
import {
  getPlayCharacter,
  savePlayCharacter,
} from "../services/play-character.service";
import {
  playSessionReducer,
  type PlaySessionAction,
} from "../utils/play-session-reducer";
import { deriveActionLocks } from "../utils/condition-effects.data";
import { recompilePlayCharacterRecord } from "../compile/compile-play-character";
import { isStubFeatureDescription } from "../compile/detect-feature-stat-effects";
import {
  clearRollLog,
  loadRollLog,
  MAX_ROLLS,
  saveRollLog,
} from "../utils/roll-log.storage";

const AUTOSAVE_MS = 400;

function needsFeatureCatalogEnrichment(
  compiled: PlayCharacterCompiled,
): boolean {
  const stubFeatures = compiled.features.some(
    (f) =>
      f.sourceKind !== "standard" &&
      isStubFeatureDescription(f.name, f.description, f.sourceKind),
  );
  if (stubFeatures) return true;
  const spells = compiled.spellcasting?.spells ?? [];
  return spells.some((s) => !s.description?.trim());
}

export function usePlayCharacter(characterId: string | undefined) {
  const [record, setRecord] = useState<PlayCharacterRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rolls, setRolls] = useState<PlayRollEntry[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<PlayCharacterRecord | null>(null);

  useEffect(() => {
    if (!characterId) {
      setRolls([]);
      return;
    }
    setRolls(loadRollLog(characterId));
  }, [characterId]);

  useEffect(() => {
    if (!characterId) {
      setRecord(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPlayCharacter(characterId)
      .then(async (r) => {
        if (cancelled) return;
        if (!r) {
          setError("Character not found");
          return;
        }
        let next = r;
        if (
          r.builderJson &&
          needsFeatureCatalogEnrichment(r.compiled)
        ) {
          try {
            next = await recompilePlayCharacterRecord(r, r.builderJson);
            await savePlayCharacter(next);
          } catch {
            next = r;
          }
        }
        if (cancelled) return;
        setRecord(next);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const flushSave = useCallback(async () => {
    const r = pending.current;
    if (!r) return;
    pending.current = null;
    try {
      await savePlayCharacter(r);
    } catch {
      // ignore autosave errors; next change retries
    }
  }, []);

  const scheduleSave = useCallback(
    (next: PlayCharacterRecord) => {
      pending.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void flushSave();
      }, AUTOSAVE_MS);
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void flushSave();
    };
  }, [flushSave]);

  const dispatch = useCallback(
    (action: PlaySessionAction) => {
      setRecord((prev) => {
        if (!prev) return prev;
        const { session, meta } = playSessionReducer(
          prev.compiled,
          prev.session,
          action,
        );
        const next = { ...prev, session, updatedAt: new Date().toISOString() };
        scheduleSave(next);
        if (meta?.hitDieDetail) {
          setRolls((rs) => {
            const nextRolls = [
              {
                id: crypto.randomUUID(),
                label: "Hit Die",
                expression: meta.hitDieDetail ?? "",
                total: meta.healed ?? 0,
                detail: meta.hitDieDetail ?? "",
                mode: "normal" as const,
                at: new Date().toISOString(),
              },
              ...rs,
            ].slice(0, MAX_ROLLS);
            if (characterId) saveRollLog(characterId, nextRolls);
            return nextRolls;
          });
        }
        return next;
      });
    },
    [scheduleSave, characterId],
  );

  const replaceRecord = useCallback(
    (next: PlayCharacterRecord) => {
      setRecord(next);
      scheduleSave(next);
    },
    [scheduleSave],
  );

  const addRoll = useCallback(
    (entry: Omit<PlayRollEntry, "id" | "at">) => {
      if (!characterId) return;
      setRolls((rs) => {
        const next = [
          {
            ...entry,
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
          },
          ...rs,
        ].slice(0, MAX_ROLLS);
        saveRollLog(characterId, next);
        return next;
      });
    },
    [characterId],
  );

  const clearRolls = useCallback(() => {
    setRolls([]);
    if (characterId) clearRollLog(characterId);
  }, [characterId]);

  const locks = record
    ? deriveActionLocks(
        record.session.conditions,
        record.session.exhaustion,
        record.compiled.rulesEdition,
      )
    : null;

  return {
    record,
    loading,
    error,
    dispatch,
    replaceRecord,
    locks,
    rolls,
    addRoll,
    clearRolls,
  };
}
