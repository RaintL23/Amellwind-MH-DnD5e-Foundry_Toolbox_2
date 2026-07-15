import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

export const LIST_SEARCH_DEBOUNCE_MS = 300;

export interface DebouncedListSearch {
  /** Immediate value bound to the search input. */
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  /** Debounced value to use when filtering / querying the list. */
  appliedSearch: string;
  /** True while typing or while the list filter is catching up. */
  isSearchPending: boolean;
  /** Sync draft + applied + committed immediately (clear filters, dialog apply). */
  commitSearch: (value: string) => void;
}

/**
 * Keeps list search inputs responsive: draft updates instantly, filtering waits
 * for debounce, and `isSearchPending` lets the UI show a loading state.
 *
 * `committedValue` is usually the URL (or parent state). `onCommit` persists the
 * debounced draft back to that source.
 */
export function useDebouncedListSearch(
  committedValue: string,
  onCommit: (value: string) => void,
  delay = LIST_SEARCH_DEBOUNCE_MS,
): DebouncedListSearch {
  const [draft, setDraft] = useState(committedValue);
  const debounced = useDebouncedValue(draft, delay);
  const committedRef = useRef(committedValue);
  const [applied, setApplied] = useState(committedValue);
  const [isApplying, setIsApplying] = useState(false);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // External committed changes (back/forward, shared links, clear filters).
  useEffect(() => {
    if (committedValue === committedRef.current) return;
    committedRef.current = committedValue;
    setDraft(committedValue);
    setApplied(committedValue);
  }, [committedValue]);

  // Persist debounced draft to URL / parent state.
  useEffect(() => {
    if (debounced === committedValue) return;
    committedRef.current = debounced;
    onCommitRef.current(debounced);
  }, [debounced, committedValue]);

  // Apply filter value after paint so a loading state can render first.
  useEffect(() => {
    if (debounced === applied) {
      setIsApplying(false);
      return;
    }

    setIsApplying(true);
    let cancelled = false;
    let innerId = 0;
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => {
        if (cancelled) return;
        setApplied(debounced);
        setIsApplying(false);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outerId);
      cancelAnimationFrame(innerId);
    };
  }, [debounced, applied]);

  const commitSearch = useCallback((value: string) => {
    committedRef.current = value;
    setDraft(value);
    setApplied(value);
    onCommitRef.current(value);
  }, []);

  return {
    searchDraft: draft,
    setSearchDraft: setDraft,
    appliedSearch: applied,
    isSearchPending:
      draft !== debounced || isApplying || applied !== debounced,
    commitSearch,
  };
}
