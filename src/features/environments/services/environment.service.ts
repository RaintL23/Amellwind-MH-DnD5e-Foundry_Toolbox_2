import type { Environment } from "@/shared/types";
import { ENVIRONMENTS } from "../data/environment.data";

export function getAllEnvironments(): Environment[] {
  return ENVIRONMENTS;
}

export function getEnvironmentByName(name: string): Environment | undefined {
  return ENVIRONMENTS.find((e) => e.name.toLowerCase() === name.toLowerCase());
}

export function searchEnvironments(query: string): Environment[] {
  const q = query.toLowerCase().trim();
  if (!q) return ENVIRONMENTS;
  return ENVIRONMENTS.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.biome.toLowerCase().includes(q) ||
      e.commonWeather.toLowerCase().includes(q)
  );
}
