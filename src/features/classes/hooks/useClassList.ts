import { useEffect, useMemo, useState } from "react";
import { Class } from "@/shared/types";
import { getBookSourceNames } from "@/features/spells/services/book-source.service";
import { getAllClasses } from "../services/class.service";
import { dedupeClassesByName } from "../utils/class-dedupe.utils";

export function useClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getBookSourceNames();
    getAllClasses()
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  const listClasses = useMemo(() => dedupeClassesByName(classes), [classes]);

  const sourceOptions = useMemo(
    () => Array.from(new Set(classes.map((c) => c.source))).sort(),
    [classes],
  );

  return { classes, listClasses, sourceOptions, loading };
}
