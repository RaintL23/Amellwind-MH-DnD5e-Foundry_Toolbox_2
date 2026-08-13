import {
  appendAll,
  parsePositiveInt,
  setIfPresent,
  setIntIfNotDefault,
} from "@/shared/utils/list-url-params.utils";
import type { RuneFiltersState, RuneSlotFilter } from "./rune-filters.utils";

export const RUNE_DEFAULT_PAGE_SIZE = 10;

export function parseRuneListUrlState(searchParams: URLSearchParams): {
  filters: RuneFiltersState;
  page: number;
  pageSize: number;
} {
  return {
    filters: {
      name: searchParams.get("q") ?? "",
      monster: searchParams.getAll("monster"),
      monsterCr: searchParams.getAll("mcr"),
      slot: (searchParams.get("slot") ?? "") as RuneSlotFilter,
      obtainment: searchParams.getAll("obtain"),
      tag: searchParams.getAll("tag"),
      monsterTier: searchParams.getAll("mtier"),
      materialEffectTier: searchParams.getAll("etier"),
    },
    page: parsePositiveInt(searchParams.get("page"), 1),
    pageSize: parsePositiveInt(
      searchParams.get("pageSize"),
      RUNE_DEFAULT_PAGE_SIZE,
    ),
  };
}

export function buildRuneListSearchParams(
  filters: RuneFiltersState,
  page: number,
  pageSize: number,
): URLSearchParams {
  const next = new URLSearchParams();
  setIfPresent(next, "q", filters.name);
  appendAll(next, "monster", filters.monster);
  appendAll(next, "mcr", filters.monsterCr);
  setIfPresent(next, "slot", filters.slot);
  appendAll(next, "obtain", filters.obtainment);
  appendAll(next, "tag", filters.tag);
  appendAll(next, "mtier", filters.monsterTier);
  appendAll(next, "etier", filters.materialEffectTier);
  setIntIfNotDefault(next, "page", page, 1);
  setIntIfNotDefault(next, "pageSize", pageSize, RUNE_DEFAULT_PAGE_SIZE);
  return next;
}
