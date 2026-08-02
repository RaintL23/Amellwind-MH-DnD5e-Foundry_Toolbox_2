import { useEffect, useState } from "react";
import type { Class, OptionalFeatureProgression, Subclass } from "@/shared/types";
import type { OptionalFeatureCatalogItem } from "@/features/builder/utils/class-optional-features.utils";
import { loadOptionalFeatureCatalogItems } from "../utils/class-optional-feature-browse.utils";

export function useOptionalFeatureCatalogBrowse(
  progression: OptionalFeatureProgression | null,
  classData: Class | null,
  subclass: Subclass | null,
) {
  const [items, setItems] = useState<OptionalFeatureCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!progression || !classData) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void loadOptionalFeatureCatalogItems(progression, classData, subclass)
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [progression, classData, subclass]);

  return { items, loading };
}
