import { useEffect, useState } from "react";
import { parseEntries } from "@/shared/utils/fivetools-parser";
import { getAllItems } from "@/features/shops/services/item.service";
import { getAllResources } from "@/features/resources/services/resource.service";
import { getAllForgeItems } from "../services/item-forge.service";

/** Descriptions for Combo-style ingredient hover (resources + AGMH + forge items). */
export function useForgeIngredientDescMap(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const resource of getAllResources()) {
      if (resource.details) next[resource.name] = resource.details;
    }
    setMap(next);
    Promise.all([getAllItems(), getAllForgeItems()]).then(([items, forgeItems]) => {
      const merged = { ...next };
      for (const item of items) {
        if (merged[item.name]) continue;
        const desc = parseEntries(item.entries);
        if (desc) merged[item.name] = desc;
      }
      for (const item of forgeItems) {
        const desc = parseEntries(item.entries);
        if (desc) merged[item.name] = desc;
      }
      setMap(merged);
    });
  }, []);

  return map;
}
