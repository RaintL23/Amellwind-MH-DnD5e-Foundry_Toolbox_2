/**
 * React Query hook for monster data
 *
 * Provides cached, type-safe access to monster data
 * with automatic refetching, error handling, and loading states
 */

import { useQuery } from "@tanstack/react-query";
import { fetchMonsters } from "../services/monster.service";
import type { Monster } from "../types/monster.types";

/**
 * Query key for monster data
 * Used by React Query for caching and invalidation
 */
export const MONSTERS_QUERY_KEY = ["monsters", "monster-hunter"] as const;

/**
 * Hook to fetch and cache Monster Hunter monsters
 *
 * Features:
 * - Automatic caching (24 hours)
 * - Background refetching
 * - Error handling
 * - Loading states
 *
 * @returns Query result with monster data, loading state, and error
 */
export function useMonsters() {
  return useQuery<Monster[], Error>({
    queryKey: MONSTERS_QUERY_KEY,
    queryFn: fetchMonsters,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - data rarely changes
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}
