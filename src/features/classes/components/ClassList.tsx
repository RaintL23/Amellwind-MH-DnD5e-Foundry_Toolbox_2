import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Class } from "@/shared/types";
import { useClassList } from "../hooks/useClassList";
import { getClassesByName } from "../services/class.service";
import { ClassDataTable } from "./ClassDataTable";
import { ClassListHeader } from "./ClassListHeader";
import { ClassListLoading } from "./ClassListLoading";
import { ClassListEmpty } from "./ClassListEmpty";
import type { DataTableFilterState } from "@/components/data-table/data-table.types";
import type { ColumnFiltersState } from "@tanstack/react-table";

export function ClassList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { classes, listClasses, sourceOptions, loading } = useClassList();

  // Restore initial DataTable state from URL params
  const initialSearch = searchParams.get("q") ?? "";
  const initialColumnFilters = useMemo<ColumnFiltersState | undefined>(() => {
    const caster = searchParams.get("caster");
    const srcRaw = searchParams.get("src");
    if (!caster && !srcRaw) return undefined; // let ClassDataTable apply its default source filter
    const filters: ColumnFiltersState = [];
    if (caster) filters.push({ id: "casterProgression", value: caster });
    if (srcRaw) filters.push({ id: "source", value: srcRaw.split(",") });
    return filters;
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterStateChange = useCallback(
    (state: DataTableFilterState) => {
      setSearchParams(
        () => {
          const next = new URLSearchParams();
          if (state.search) next.set("q", state.search);
          for (const f of state.columnFilters) {
            if (f.id === "casterProgression") {
              const v = f.value as string;
              if (v) next.set("caster", v);
            } else if (f.id === "source") {
              const v = f.value as string[];
              if (Array.isArray(v) && v.length > 0) next.set("src", v.join(","));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSelect = useCallback(
    async (row: Class) => {
      const variants = await getClassesByName(row.name);
      const variant =
        variants.find((v) => v.source === row.source) ?? variants[0] ?? row;
      navigate(`/classes/${encodeURIComponent(variant.id)}`);
    },
    [navigate],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <ClassListHeader
        loading={loading}
        listCount={listClasses.length}
        totalCount={classes.length}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <ClassListLoading />
        ) : listClasses.length === 0 ? (
          <ClassListEmpty />
        ) : (
          <ClassDataTable
            classes={listClasses}
            sourceOptions={sourceOptions}
            onRowClick={handleSelect}
            initialSearch={initialSearch}
            initialColumnFilters={initialColumnFilters}
            onFilterStateChange={handleFilterStateChange}
          />
        )}
      </div>
    </div>
  );
}
