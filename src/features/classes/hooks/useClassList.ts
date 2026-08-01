import { useCallback, useEffect, useState } from "react";
import { Class } from "@/shared/types";
import {
  getAllClasses,
  getClassFilterSourceCodes,
  getListClasses,
} from "../services/class.service";

export function useClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [listClasses, setListClasses] = useState<Class[]>([]);
  const [filterSourceCodes, setFilterSourceCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [all, list, codes] = await Promise.all([
      getAllClasses(),
      getListClasses(),
      getClassFilterSourceCodes(),
    ]);
    setClasses(all);
    setListClasses(list);
    setFilterSourceCodes(codes);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return { classes, listClasses, filterSourceCodes, loading, refresh };
}
