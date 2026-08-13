import { useEffect, useMemo, useState } from "react";
import { MHItem } from "@/shared/types";
import { getAllItems } from "../services/item.service";

export function useItems() {
  const [items, setItems] = useState<MHItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const uniqueTypes = useMemo(
    () => Array.from(new Set(items.map((i) => i.typeLabel))).sort(),
    [items],
  );

  return { items, loading, uniqueTypes };
}
