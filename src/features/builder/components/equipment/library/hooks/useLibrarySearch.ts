import { useEffect, useState } from "react";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import { useDebouncedListSearch } from "@/shared/hooks/useDebouncedListSearch";

export function useLibrarySearch(selectedSlot: BuilderSlotSelection) {
  const [committed, setCommitted] = useState("");
  const { searchDraft, setSearchDraft, appliedSearch, commitSearch } =
    useDebouncedListSearch(committed, setCommitted);

  useEffect(() => {
    commitSearch("");
  }, [selectedSlot, commitSearch]);

  const q = appliedSearch.toLowerCase().trim();

  return { search: searchDraft, setSearch: setSearchDraft, q };
}
