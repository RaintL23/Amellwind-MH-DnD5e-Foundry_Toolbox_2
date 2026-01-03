/**
 * useRunes Hook
 * React Query hook for fetching all runes
 */

import { useQuery } from "@tanstack/react-query";
import { fetchAllRunes } from "../services/rune.service";

export function useRunes() {
  return useQuery({
    queryKey: ["runes"],
    queryFn: fetchAllRunes,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

