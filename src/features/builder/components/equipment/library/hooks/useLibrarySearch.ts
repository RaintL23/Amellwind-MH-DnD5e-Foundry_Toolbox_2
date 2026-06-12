import { useEffect, useState } from "react";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";

export function useLibrarySearch(selectedSlot: BuilderSlotSelection) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [selectedSlot]);

  const q = search.toLowerCase().trim();

  return { search, setSearch, q };
}
