import { useCallback, useEffect, useState } from "react";

type CompendiumLoadResult<TAll, TList> = {
  all: TAll[];
  list: TList[];
};

/**
 * Shared loading pattern for compendium list pages (all entries + deduped list).
 */
export function useCompendiumList<TAll, TList>({
  load,
}: {
  load: () => Promise<CompendiumLoadResult<TAll, TList>>;
}) {
  const [all, setAll] = useState<TAll[]>([]);
  const [list, setList] = useState<TList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await load();
      setAll(result.all);
      setList(result.list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { all, list, loading, error, refresh };
}
