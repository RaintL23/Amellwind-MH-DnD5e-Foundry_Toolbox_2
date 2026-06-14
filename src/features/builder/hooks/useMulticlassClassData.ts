import { useEffect, useState } from "react";
import type { Class } from "@/shared/types";
import type { BuilderMulticlassEntry } from "@/shared/types";
import { getClassById } from "@/features/classes/services/class.service";

export function useMulticlassClassData(
  entries: BuilderMulticlassEntry[],
): { data: (Class | null)[]; loading: boolean } {
  const [data, setData] = useState<(Class | null)[]>([]);
  const [loading, setLoading] = useState(false);

  const entryIds = entries.map((e) => e.classRef?.id ?? "").join("|");

  useEffect(() => {
    const activeEntries = entries.filter((e) => e.classRef?.id);
    if (!activeEntries.length) {
      setData(entries.map(() => null));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      entries.map((entry) =>
        entry.classRef?.id
          ? getClassById(entry.classRef.id).then((cls) => cls ?? null)
          : Promise.resolve(null),
      ),
    )
      .then((results) => {
        if (!cancelled) setData(results);
      })
      .catch(() => {
        if (!cancelled) setData(entries.map(() => null));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entryIds, entries.length]);

  return { data, loading };
}
