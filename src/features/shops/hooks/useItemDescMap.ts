import { useEffect, useState } from "react";
import { parseEntries } from "@/shared/utils/fivetools-parser";
import { getAllItems } from "../services/item.service";

export function useItemDescMap(): Record<string, string> {
  const [itemDescMap, setItemDescMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllItems().then((items) => {
      const map: Record<string, string> = {};
      items.forEach((item) => {
        const desc = parseEntries(item.entries);
        if (desc) map[item.name] = desc;
      });
      setItemDescMap(map);
    });
  }, []);

  return itemDescMap;
}
