import { useEffect, useMemo, useState } from "react";
import type { Class } from "@/shared/types";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { getClassesByName } from "@/features/classes/services/class.service";
import { sortClassVariants } from "@/features/classes/utils/class-dedupe.utils";
import { getFieldsThatVaryAcrossVariants } from "@/features/classes/utils/class-variant.utils";

export function useClassVariants(classData: Class | null) {
  const [variants, setVariants] = useState<Class[]>([]);
  const bookNames = useBookSourceNames();

  useEffect(() => {
    if (!classData) {
      setVariants([]);
      return;
    }

    let cancelled = false;
    void getClassesByName(classData.name).then((byName) => {
      if (cancelled) return;
      const playable = byName.filter((c) => !c.isSidekick);
      setVariants(
        playable.length > 0 ? sortClassVariants(playable) : [classData],
      );
    });

    return () => {
      cancelled = true;
    };
  }, [classData?.name]);

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(variants),
    [variants],
  );

  return { variants, varyingFields, bookNames };
}
