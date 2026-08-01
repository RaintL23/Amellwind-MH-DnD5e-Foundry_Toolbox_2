import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  emptyListSessionState,
  isListSessionStateEmpty,
  normalizeListSessionState,
  parseListFiltersFromSearchParams,
  readListSessionState,
  writeListSessionState,
  type ListSessionStoredState,
} from "@/shared/utils/list-session-storage.utils";

export interface UseListSessionFiltersOptions {
  /** Stable id for sessionStorage (`list-filters:<listId>`). */
  listId: string;
  /** Single-value fields. Defaults to `["q"]`. */
  stringKeys?: readonly string[];
  /** Multi-value fields (`src`, `lvl`, …). */
  multiKeys: readonly string[];
  /**
   * One-shot: if session is empty, import matching query params into session,
   * then strip those filter keys from the URL. Default: true.
   */
  migrateFromUrl?: boolean;
  /** Query keys that must stay in the URL (selection, rarity, …). */
  urlPreserveKeys?: readonly string[];
}

export interface ListSessionFiltersApi {
  /** Current search string (`q`). */
  q: string;
  getString: (key: string) => string;
  getAll: (key: string) => string[];
  /** Merge patch into session filter state. */
  patchFilters: (patch: Record<string, string | string[] | undefined>) => void;
  /** Fill a multi key only when it is currently empty (e.g. default sources). */
  ensureMultiIfEmpty: (key: string, values: string[]) => void;
}

/**
 * List search/filter state persisted in sessionStorage (per tab), not the URL.
 * Optionally migrates leftover `?src=&q=` query params into session once.
 */
export function useListSessionFilters(
  options: UseListSessionFiltersOptions,
): ListSessionFiltersApi {
  const {
    listId,
    stringKeys = ["q"] as const,
    multiKeys,
    migrateFromUrl = true,
    urlPreserveKeys = [],
  } = options;

  const stringKeyList = useMemo(
    () => [...stringKeys],
    [stringKeys.join("\0")],
  );
  const multiKeyList = useMemo(
    () => [...multiKeys],
    [multiKeys.join("\0")],
  );
  const preserveKeyList = useMemo(
    () => [...urlPreserveKeys],
    [urlPreserveKeys.join("\0")],
  );

  const [, setSearchParams] = useSearchParams();
  const migratedRef = useRef(false);

  const [state, setState] = useState<ListSessionStoredState>(() => {
    const fromSession = normalizeListSessionState(
      readListSessionState(listId),
      stringKeyList,
      multiKeyList,
    );
    if (!isListSessionStateEmpty(fromSession, stringKeyList, multiKeyList)) {
      return fromSession;
    }
    if (migrateFromUrl && typeof window !== "undefined") {
      const fromUrl = parseListFiltersFromSearchParams(
        new URLSearchParams(window.location.search),
        stringKeyList,
        multiKeyList,
      );
      if (!isListSessionStateEmpty(fromUrl, stringKeyList, multiKeyList)) {
        return fromUrl;
      }
    }
    return emptyListSessionState(stringKeyList, multiKeyList);
  });

  useEffect(() => {
    writeListSessionState(listId, state);
  }, [listId, state]);

  useEffect(() => {
    if (!migrateFromUrl || migratedRef.current) return;
    migratedRef.current = true;

    setSearchParams(
      (prev) => {
        const filterKeys = new Set([...stringKeyList, ...multiKeyList]);
        let changed = false;
        const next = new URLSearchParams();

        for (const [key, value] of prev.entries()) {
          if (filterKeys.has(key) && !preserveKeyList.includes(key)) {
            changed = true;
            continue;
          }
          next.append(key, value);
        }

        return changed ? next : prev;
      },
      { replace: true },
    );
  }, [migrateFromUrl, multiKeyList, preserveKeyList, setSearchParams, stringKeyList]);

  const patchFilters = useCallback(
    (patch: Record<string, string | string[] | undefined>) => {
      setState((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) continue;
          if (stringKeyList.includes(key) && typeof value === "string") {
            next[key] = value;
          } else if (multiKeyList.includes(key) && Array.isArray(value)) {
            next[key] = value;
          }
        }
        return next;
      });
    },
    [multiKeyList, stringKeyList],
  );

  const ensureMultiIfEmpty = useCallback(
    (key: string, values: string[]) => {
      if (!multiKeyList.includes(key) || values.length === 0) return;
      setState((prev) => {
        const current = prev[key];
        if (Array.isArray(current) && current.length > 0) return prev;
        return { ...prev, [key]: values };
      });
    },
    [multiKeyList],
  );

  const getString = useCallback(
    (key: string) => {
      const value = state[key];
      return typeof value === "string" ? value : "";
    },
    [state],
  );

  const getAll = useCallback(
    (key: string) => {
      const value = state[key];
      return Array.isArray(value) ? value : [];
    },
    [state],
  );

  return {
    q: getString("q"),
    getString,
    getAll,
    patchFilters,
    ensureMultiIfEmpty,
  };
}
