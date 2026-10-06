import { useEffect, useState } from "react";
import type { DndItem } from "@/shared/types";
import { getDndItemById } from "../services/dnd-item.service";
import { itemId } from "../utils/item-uids.utils";

/**
 * Compendium `DndItem` for a Builder weapon/armor (same name + source), so the
 * Library can render the exact compendium content. `null` while loading,
 * when disabled, or when the item is not in the compendium catalog.
 */
export function useDndItemByNameSource(
  name: string | undefined,
  source: string | undefined,
  enabled = true,
): DndItem | null {
  const [item, setItem] = useState<DndItem | null>(null);

  useEffect(() => {
    setItem(null);
    if (!enabled || !name || !source) return;
    let cancelled = false;
    void getDndItemById(itemId({ name, source })).then((found) => {
      if (!cancelled) setItem(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [name, source, enabled]);

  return item;
}
