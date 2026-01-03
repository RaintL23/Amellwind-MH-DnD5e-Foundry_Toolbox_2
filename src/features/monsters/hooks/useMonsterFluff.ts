/**
 * Hook for fetching monster fluff (lore and descriptions)
 */

import { useQuery } from "@tanstack/react-query";
import { fetchMonsterFluff } from "../services/monster.service";
import type { MonsterFluff } from "../types/monster.types";

/**
 * Hook to fetch monster fluff data
 *
 * @param monsterName - Name of the monster
 * @param source - Source of the monster
 * @returns Query result with fluff data, loading state, and error
 */
export function useMonsterFluff(monsterName: string, source: string) {
  return useQuery<MonsterFluff | null, Error>({
    queryKey: ["monster-fluff", monsterName, source] as const,
    queryFn: () => fetchMonsterFluff(monsterName, source),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

