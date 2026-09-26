import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PlayCharacterRecord,
  PlayRollEntry,
} from "../utils/play-character.types";
import { PLAY_COMPILE_VERSION } from "../utils/play-character.types";
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
import {
  clearRollLog,
  loadRollLog,
  MAX_ROLLS,
  saveRollLog,
} from "../utils/roll-log.storage";

const AUTOSAVE_MS = 400;

function needsRecompile(record: PlayCharacterRecord): boolean {
  const version = record.compileVersion ?? 0;
  return version < PLAY_COMPILE_VERSION && Boolean(record.builderJson);
}

function migrateSessionExhaustion(record: PlayCharacterRecord): PlayCharacterRecord {
  const hasExhaustionCond = record.session.conditions.some((c) => {
    const n = c.name.trim().toLowerCase();
    return n === "exhaustion" || n === "exhausted";
  });
  if (!hasExhaustionCond) return record;
  const { session } = playSessionReducer(
    record.compiled,
    record.session,
    { type: "MIGRATE_EXHAUSTION_CONDITIONS" },
  );
  return { ...record, session, updatedAt: new Date().toISOString() };
}

export function usePlayCharacter(characterId: string | undefined) {
  const [record, setRecord] = useState<PlayCharacterRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rolls, setRolls] = useState<PlayRollEntry[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<PlayCharacterRecord | null>(null);
  const recordRef = useRef<PlayCharacterRecord | null>(null);

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  useEffect(() => {
    if (!characterId) {
      setRolls([]);
      return;
    }
    setRolls(loadRollLog(characterId));
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
    const onHidden = () => {
      if (document.visibilityState === "hidden") {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        void flushSave();
      }
    };
    const onPageHide = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void flushSave();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void flushSave();
    };
  }, [flushSave]);

  useEffect(() => {
    if (!characterId) {
      setRecord(null);
      recordRef.current = null;
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRecord(null);
    recordRef.current = null;

    getPlayCharacter(characterId)
      .then((r) => {
        if (cancelled) return;
        if (!r) {
          setError("Character not found");
          setLoading(false);
          return;
        }
        const migrated = migrateSessionExhaustion(r);
        setRecord(migrated);
        recordRef.current = migrated;
        setError(null);
        setLoading(false);

        if (needsRecompile(migrated)) {
          void (async () => {
            try {
              let next = await recompilePlayCharacterRecord(
                migrated,
                migrated.builderJson,
              );
              const clamped = playSessionReducer(next.compiled, next.session, {
                type: "SYNC_CLAMP",
                compiled: next.compiled,
              });
              next = {
                ...next,
                session: clamped.session,
                compileVersion: PLAY_COMPILE_VERSION,
              };
              next = migrateSessionExhaustion(next);
              if (cancelled) return;
              // Don't overwrite newer session edits made while recompiling
              const current = recordRef.current;
              if (current && current.id === next.id) {
                next = {
                  ...next,
                  session: current.session,
                };
                const reclamped = playSessionReducer(
                  next.compiled,
                  next.session,
                  { type: "SYNC_CLAMP", compiled: next.compiled },
                );
                next = { ...next, session: reclamped.session };
              }
              setRecord(next);
              recordRef.current = next;
              await savePlayCharacter(next);
            } catch {
              // Keep showing the loaded record; retry next open if version still stale
            }
          })();
        } else if (migrated !== r) {
          scheduleSave(migrated);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Load failed");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [characterId, scheduleSave]);

  const dispatch = useCallback(
    (action: PlaySessionAction) => {
      const prev = recordRef.current;
      if (!prev) return;
      const { session, meta } = playSessionReducer(
        prev.compiled,
        prev.session,
        action,
      );
      const next = { ...prev, session, updatedAt: new Date().toISOString() };
      recordRef.current = next;
      setRecord(next);
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
    },
    [scheduleSave, characterId],
  );

  const replaceRecord = useCallback(
    (next: PlayCharacterRecord) => {
      recordRef.current = next;
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
