import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { parsePositiveInt } from "@/shared/utils/list-url-params.utils";

export function useListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const replaceParams = useCallback(
    (build: (prev: URLSearchParams) => URLSearchParams) => {
      setSearchParams(build, { replace: true });
    },
    [setSearchParams],
  );

  const getString = useCallback(
    (key: string, fallback = "") => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  const getAll = useCallback(
    (key: string) => searchParams.getAll(key),
    [searchParams],
  );

  const getInt = useCallback(
    (key: string, fallback: number) =>
      parsePositiveInt(searchParams.get(key), fallback),
    [searchParams],
  );

  const setString = useCallback(
    (key: string, value: string, defaultValue = "") => {
      replaceParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== defaultValue) next.set(key, value);
        else next.delete(key);
        return next;
      });
    },
    [replaceParams],
  );

  const setMulti = useCallback(
    (key: string, values: string[]) => {
      replaceParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete(key);
        for (const value of values) {
          if (value) next.append(key, value);
        }
        return next;
      });
    },
    [replaceParams],
  );

  const patchFields = useCallback(
    (fields: Record<string, string | string[] | undefined>) => {
      replaceParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined) continue;
          next.delete(key);
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item) next.append(key, item);
            }
          } else if (value) {
            next.set(key, value);
          }
        }
        return next;
      });
    },
    [replaceParams],
  );

  return {
    searchParams,
    replaceParams,
    getString,
    getAll,
    getInt,
    setString,
    setMulti,
    patchFields,
  };
}
