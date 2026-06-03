import { useEffect, useMemo, useState } from "react";
import { Class } from "@/shared/types";
import {
  buildSourceOptions,
  collectEntitySources,
} from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { getAllClasses, getListClasses } from "../services/class.service";

export function useClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [listClasses, setListClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const bookNames = useBookSourceNames();

  useEffect(() => {
    Promise.all([getAllClasses(), getListClasses()])
      .then(([all, list]) => {
        setClasses(all);
        setListClasses(list);
      })
      .finally(() => setLoading(false));
  }, []);

  const sourceOptions = useMemo(
    () => buildSourceOptions(collectEntitySources(listClasses), bookNames),
    [listClasses, bookNames],
  );

  return { classes, listClasses, sourceOptions, loading };
}
