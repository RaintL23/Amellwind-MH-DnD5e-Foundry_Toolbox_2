/**
 * Musical instrument names for builder pickers — sourced from 5etools
 * items-base.json entries with type INS (Instrument).
 */
import { ITEMS_BASE_JSON_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import type { ItemsBaseJson } from "@/features/dnd-items/utils/item-raw.types";

function isInstrumentType(type?: string): boolean {
  if (!type) return false;
  return type.split("|")[0]?.toUpperCase() === "INS";
}

function collectInstrumentNames(raw: ItemsBaseJson): string[] {
  const names = new Set<string>();

  for (const item of raw.baseitem ?? []) {
    if (item.noDisplay) continue;
    if (!isInstrumentType(item.type)) continue;
    const name = item.name?.trim();
    if (name) names.add(name);
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}

let musicalInstrumentNames: readonly string[] = [];
let loadPromise: Promise<void> | null = null;

/** Fetch and cache musical instrument names from 5etools (idempotent). */
export async function loadChooseableMusicalInstruments(): Promise<void> {
  if (musicalInstrumentNames.length) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      const raw = await fetchFiveToolsJson<ItemsBaseJson>(
        ITEMS_BASE_JSON_URL,
        "items-base.json",
      );
      musicalInstrumentNames = collectInstrumentNames(raw);
    })();
  }
  await loadPromise;
}

/** Flat deduplicated list of musical instrument names. */
export function getChooseableMusicalInstruments(): readonly string[] {
  return musicalInstrumentNames;
}
