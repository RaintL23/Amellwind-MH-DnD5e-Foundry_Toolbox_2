import type { ColumnFiltersState, FilterFn } from "@tanstack/react-table";
import type { MaterialEffectSlot } from "@/shared/types";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import {
  hasActiveRuneEffectListFilters,
  runeEffectMatchesListFilters,
  type RuneListEffectFilters,
} from "../../utils/rune-compatibility.utils";
import {
  matchesRuneSearchQuery,
  type RuneSearchIndexEntry,
} from "../../utils/rune-search.utils";
import type { RuneFiltersState, RuneSlotFilter } from "./rune-filters.utils";

export type RuneListRow = RuneSearchIndexEntry;

/** Hidden TanStack column id — holds the composite list filter payload. */
export const RUNE_LIST_FILTER_COLUMN_ID = "_filters";

export interface RuneTableFilterPayload {
  q: string;
  monster: string[];
  monsterCr: string[];
  slot: RuneSlotFilter;
  obtainment: string[];
  tag: string[];
  monsterTier: string[];
  materialEffectTier: string[];
  materialEffectName: string[];
}

export const EMPTY_RUNE_TABLE_FILTER_PAYLOAD: RuneTableFilterPayload = {
  q: "",
  monster: [],
  monsterCr: [],
  slot: "",
  obtainment: [],
  tag: [],
  monsterTier: [],
  materialEffectTier: [],
  materialEffectName: [],
};

function getFilterPayload(
  columnFilters: ColumnFiltersState,
): RuneTableFilterPayload {
  const entry = columnFilters.find((f) => f.id === RUNE_LIST_FILTER_COLUMN_ID);
  if (!entry?.value) return EMPTY_RUNE_TABLE_FILTER_PAYLOAD;
  return {
    ...EMPTY_RUNE_TABLE_FILTER_PAYLOAD,
    ...(entry.value as RuneTableFilterPayload),
  };
}

function matchesObtainment(row: RuneListRow, obtainment: string[]): boolean {
  if (obtainment.length === 0) return true;
  return obtainment.some((value) => {
    if (value === "Carveable") return row.rune.carveChance !== "-";
    if (value === "Capturable") return row.rune.captureChance !== "-";
    if (value === "Both" || value === "Ambas") {
      return row.rune.carveChance !== "-" && row.rune.captureChance !== "-";
    }
    return false;
  });
}

function matchesEffectFilters(
  row: RuneListRow,
  filters: RuneListEffectFilters,
  materialEffectIndex: MaterialEffectNameIndex | null,
): boolean {
  if (!hasActiveRuneEffectListFilters(filters)) return true;
  return (["weapon", "armor"] as MaterialEffectSlot[]).some((kind) =>
    runeEffectMatchesListFilters(
      row.rune,
      kind,
      filters,
      materialEffectIndex,
    ),
  );
}

export function matchesRuneListRow(
  row: RuneListRow,
  payload: RuneTableFilterPayload,
  materialEffectIndex: MaterialEffectNameIndex | null,
): boolean {
  const merged = {
    ...EMPTY_RUNE_TABLE_FILTER_PAYLOAD,
    ...payload,
  };

  if (merged.q.trim()) {
    const searchContext = {
      slot: merged.slot,
      tags: merged.tag,
      materialEffectTier: merged.materialEffectTier,
    };
    if (!matchesRuneSearchQuery(row, merged.q, searchContext)) {
      return false;
    }
  }

  if (
    merged.monster.length > 0 &&
    !merged.monster.includes(row.rune.monsterName)
  ) {
    return false;
  }

  if (
    merged.monsterCr.length > 0 &&
    !row.rune.monsterCrs.some((cr) => merged.monsterCr.includes(cr))
  ) {
    return false;
  }

  if (!matchesObtainment(row, merged.obtainment)) return false;

  if (
    merged.monsterTier.length > 0 &&
    !merged.monsterTier.includes(String(row.rune.tier))
  ) {
    return false;
  }

  const effectFilters: RuneListEffectFilters = {
    slot: merged.slot,
    tag: merged.tag,
    materialEffectTier: merged.materialEffectTier,
    materialEffectName: merged.materialEffectName,
  };
  if (!matchesEffectFilters(row, effectFilters, materialEffectIndex)) {
    return false;
  }

  return true;
}

export function createRuneListRowFilterFn(
  materialEffectIndex: MaterialEffectNameIndex | null,
): FilterFn<RuneListRow> {
  return (row, _columnId, filterValue) =>
    matchesRuneListRow(
      row.original,
      filterValue as RuneTableFilterPayload,
      materialEffectIndex,
    );
}

export function payloadFromRuneFilters(
  filters: RuneFiltersState,
): RuneTableFilterPayload {
  return {
    q: filters.name,
    monster: filters.monster,
    monsterCr: filters.monsterCr,
    slot: filters.slot,
    obtainment: filters.obtainment,
    tag: filters.tag,
    monsterTier: filters.monsterTier,
    materialEffectTier: filters.materialEffectTier,
    materialEffectName: filters.materialEffect,
  };
}

export function buildRuneColumnFilters(
  filters: RuneFiltersState,
): ColumnFiltersState {
  return [
    { id: RUNE_LIST_FILTER_COLUMN_ID, value: payloadFromRuneFilters(filters) },
  ];
}

export function parseRuneColumnFilters(
  columnFilters: ColumnFiltersState,
): RuneFiltersState {
  const payload = getFilterPayload(columnFilters);
  return {
    name: payload.q,
    monster: payload.monster,
    monsterCr: payload.monsterCr,
    slot: payload.slot,
    obtainment: payload.obtainment,
    tag: payload.tag,
    monsterTier: payload.monsterTier,
    materialEffectTier: payload.materialEffectTier,
    materialEffect: payload.materialEffectName,
  };
}

export function hasActiveRuneTableFilters(
  payload: RuneTableFilterPayload,
): boolean {
  return (
    payload.q.trim().length > 0 ||
    payload.monster.length > 0 ||
    payload.monsterCr.length > 0 ||
    payload.slot !== "" ||
    payload.obtainment.length > 0 ||
    payload.tag.length > 0 ||
    payload.monsterTier.length > 0 ||
    payload.materialEffectTier.length > 0 ||
    payload.materialEffectName.length > 0
  );
}
