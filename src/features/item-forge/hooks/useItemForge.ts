import { useEffect, useMemo, useState } from "react";
import type { RaintdmItem } from "../types/item-forge.types";
import {
  clearForgeItemCache,
  getAllForgeItems,
} from "../services/item-forge.service";

export function useItemForge() {
  const [items, setItems] = useState<RaintdmItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    clearForgeItemCache();
    getAllForgeItems().then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueTypes = useMemo(
    () => Array.from(new Set(items.map((i) => i.typeLabel))).sort(),
    [items],
  );

  return { items, loading, uniqueTypes };
}
