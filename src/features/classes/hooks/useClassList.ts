import { useEffect, useMemo, useState } from "react";
import { Class } from "@/shared/types";
import {
  buildSourceOptions,
  collectEntitySources,
  getBookSourceNames,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { getAllClasses } from "../services/class.service";
import { dedupeClassesByName } from "../utils/class-dedupe.utils";

export function useClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
    getAllClasses()
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  const listClasses = useMemo(() => dedupeClassesByName(classes), [classes]);

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listClasses), bookNames),
    [listClasses, bookNames],
  );

  return { classes, listClasses, sourceOptions, loading };
}
