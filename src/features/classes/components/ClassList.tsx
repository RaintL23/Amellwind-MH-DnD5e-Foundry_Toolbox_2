import { useNavigate } from "react-router-dom";
import { Class } from "@/shared/types";
import { useClassList } from "../hooks/useClassList";
import { getClassesByName } from "../utils/class-dedupe.utils";
import { ClassDataTable } from "./ClassDataTable";
import { ClassListHeader } from "./ClassListHeader";
import { ClassListLoading } from "./ClassListLoading";
import { ClassListEmpty } from "./ClassListEmpty";

export function ClassList() {
  const navigate = useNavigate();
  const { classes, listClasses, sourceOptions, loading } = useClassList();

  function handleSelect(row: Class) {
    const variants = getClassesByName(classes, row.name);
    const variant =
      variants.find((v) => v.source === row.source) ?? variants[0] ?? row;
    navigate(`/classes/${encodeURIComponent(variant.id)}`);
  }

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
          />
        )}
      </div>
    </div>
  );
}
