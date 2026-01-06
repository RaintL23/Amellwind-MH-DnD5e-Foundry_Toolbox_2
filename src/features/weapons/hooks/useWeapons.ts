/**
 * useWeapons Hook
 * React Query hook for fetching all hunter weapons
 */

import { useQuery } from "@tanstack/react-query";
import { fetchHunterWeapons } from "../services/weapon.service";

export function useWeapons() {
  return useQuery({
    queryKey: ["weapons"],
    queryFn: fetchHunterWeapons,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

