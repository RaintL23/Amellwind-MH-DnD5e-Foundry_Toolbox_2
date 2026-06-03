import { useEffect, useState } from "react";
import { parseEntries } from "@/shared/utils/fivetools-parser";
import { getAllItems } from "../services/item.service";
import { SHOPS } from "../data/shops.data";

function collectShopItemNames(): Set<string> {
  const names = new Set<string>();
  for (const shop of SHOPS) {
    for (const section of shop.sections) {
      for (const entry of section.entries) {
        names.add(entry.name);
      }
    }
  }
  return names;
}

const shopItemNames = collectShopItemNames();

export function useItemDescMap(): Record<string, string> {
  const [itemDescMap, setItemDescMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllItems().then((items) => {
      const map: Record<string, string> = {};
      for (const item of items) {
        if (!shopItemNames.has(item.name)) continue;
        const desc = parseEntries(item.entries);
        if (desc) map[item.name] = desc;
      }
      setItemDescMap(map);
    });
  }, []);

  return itemDescMap;
}
