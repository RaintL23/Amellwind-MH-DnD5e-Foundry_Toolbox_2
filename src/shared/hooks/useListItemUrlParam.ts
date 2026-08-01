import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Syncs a single selected list item to the URL query string
 * (e.g. `/spells?spell=Fireball`). Filters stay out of the URL.
 */
export function useListItemUrlParam(paramKey: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(paramKey);

  const setValue = useCallback(
    (next: string | null) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          const current = params.get(paramKey);
          if (next) {
            if (current === next) return prev;
            params.set(paramKey, next);
          } else {
            if (current == null) return prev;
            params.delete(paramKey);
          }
          return params;
        },
        { replace: true },
      );
    },
    [paramKey, setSearchParams],
  );

  return { value, setValue };
}
