import { useEffect, useMemo, useState } from "react";
import { Class } from "@/shared/types";
import { getAllClasses } from "../services/class.service";
import { getBookSourceNames } from "@/features/spells/services/book-source.service";
import {
  dedupeClassesByName,
  getClassesByName,
} from "../utils/class-dedupe.utils";
import { ClassDetailDialog } from "./ClassDetailDialog";
import { ClassDataTable } from "./ClassDataTable";
import { User } from "lucide-react";

export function ClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Class | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    void getBookSourceNames();
    getAllClasses()
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  const listClasses = useMemo(() => dedupeClassesByName(classes), [classes]);

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(classes.map((c) => c.source))).sort();
  }, [classes]);

  const selectedVariants = useMemo(() => {
    if (!selected) return [];
    return getClassesByName(classes, selected.name);
  }, [selected, classes]);

  function handleSelect(row: Class) {
    const variants = getClassesByName(classes, row.name);
    const variant =
      variants.find((v) => v.source === row.source) ?? variants[0] ?? row;
    setSelected(variant);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <User className="h-6 w-6 text-sky-400" />
          <h1 className="text-xl font-bold text-foreground">Classes (D&amp;D 5e)</h1>
          {!loading && (
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {listClasses.length} classes
              {listClasses.length < classes.length && (
                <span className="opacity-70"> ({classes.length} entries)</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          One row per class name; open a class to view level progression, features, and subclasses.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <span className="text-sm">Loading classes...</span>
            </div>
          </div>
        ) : listClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <User className="h-10 w-10 opacity-20" />
            <p className="text-sm">No classes loaded.</p>
          </div>
        ) : (
          <ClassDataTable
            classes={listClasses}
            sourceOptions={sourceOptions}
            onRowClick={handleSelect}
          />
        )}
      </div>

      <ClassDetailDialog
        cls={selected}
        variants={selectedVariants}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
