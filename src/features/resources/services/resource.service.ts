import type { Resource, ResourceCategory, ResourceRarity, ResourceTableData } from "@/shared/types";
import { RESOURCE_TABLES } from "../data/resource.data";

export function getAllResourceTables(): ResourceTableData[] {
  return RESOURCE_TABLES;
}

export function getResourceTableByCategory(category: ResourceCategory): ResourceTableData | undefined {
  return RESOURCE_TABLES.find((t) => t.category === category);
}

export function getAllResources(): Resource[] {
  return RESOURCE_TABLES.flatMap((t) => t.resources);
}

export function getResourcesByCategory(category: ResourceCategory): Resource[] {
  return getResourceTableByCategory(category)?.resources ?? [];
}

export function getResourcesByRarity(rarity: ResourceRarity): Resource[] {
  return getAllResources().filter((r) => r.rarity === rarity);
}

export function searchResources(query: string): Resource[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllResources();
  return getAllResources().filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.details.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
  );
}

export function getCraftingMaterials(): Resource[] {
  return getAllResources().filter((r) => r.isCraftingMaterial);
}
