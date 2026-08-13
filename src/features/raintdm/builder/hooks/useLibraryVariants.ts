import { useEffect, useState } from "react";

export function useLibraryVariants<T>(
  enabled: boolean,
  name: string | undefined,
  fetchByName: ((name: string) => Promise<T[]>) | null,
): T[] {
  const [variants, setVariants] = useState<T[]>([]);

  useEffect(() => {
    if (!enabled || !name || !fetchByName) {
      setVariants([]);
      return;
    }

    let cancelled = false;
    void fetchByName(name).then((result) => {
      if (!cancelled) setVariants(result);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, name, fetchByName]);

  return variants;
}
