import type { RaintdmItem, RaintdmItemsManifest } from "../types/item-forge.types";
import { parseImportedItems } from "../mappers/item-forge.mapper";

const MANIFEST_URL = "/data/raintdm-items/manifest.json";
const ITEMS_BASE = "/data/raintdm-items";
const FETCH_INIT: RequestInit = { cache: "no-store" };

let cache: RaintdmItem[] | null = null;

async function loadCuratedFromManifest(): Promise<RaintdmItem[]> {
  const manifestRes = await fetch(MANIFEST_URL, FETCH_INIT);
  if (!manifestRes.ok) {
    throw new Error(`Manifest not found (${manifestRes.status})`);
  }

  const manifest = (await manifestRes.json()) as RaintdmItemsManifest;
  const files = Array.isArray(manifest.items) ? manifest.items : [];
  if (files.length === 0) return [];

  const payloads = await Promise.all(
    files.map(async (file) => {
      const safeName = file.replace(/\\/g, "/").split("/").pop() ?? "";
      if (!safeName || safeName === "." || safeName === ".." || !/\.json$/i.test(safeName)) {
        console.warn(`Skipped unsafe curated item path: ${file}`);
        return null;
      }
      const res = await fetch(
        `${ITEMS_BASE}/${encodeURIComponent(safeName)}`,
        FETCH_INIT,
      );
      if (!res.ok) {
        console.warn(`Failed to load curated items: ${safeName}`);
        return null;
      }
      return (await res.json()) as unknown;
    }),
  );

  return parseImportedItems(payloads.filter((p) => p != null));
}

export async function getAllForgeItems(): Promise<RaintdmItem[]> {
  if (cache) return cache;

  try {
    cache = await loadCuratedFromManifest();
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

export function clearForgeItemCache(): void {
  cache = null;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cache = null;
  });
}
