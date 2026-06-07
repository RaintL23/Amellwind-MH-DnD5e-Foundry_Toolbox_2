import type { DndBackground } from "@/shared/types";
import {
  BACKGROUNDS_JSON_URL,
  FLUFF_BACKGROUNDS_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { mapDndBackground } from "../mappers/dnd-background.mapper";
import { dedupeDndBackgroundsByName } from "../utils/dnd-background-dedupe.utils";

let cache: DndBackground[] | null = null;
let listCache: DndBackground[] | null = null;
let byNameIndex: Map<string, DndBackground[]> | null = null;
let byIdIndex: Map<string, DndBackground> | null = null;

function buildIndexes(all: DndBackground[]): void {
  byIdIndex = new Map(all.map((b) => [b.id, b]));

  const byName = new Map<string, DndBackground[]>();
  for (const bg of all) {
    const group = byName.get(bg.name) ?? [];
    group.push(bg);
    byName.set(bg.name, group);
  }
  byNameIndex = byName;
  listCache = dedupeDndBackgroundsByName(all);
}

type RawBackgroundEntry = Record<string, unknown>;

function buildFluffIndex(
  fluffEntries: RawBackgroundEntry[],
): Map<string, RawBackgroundEntry> {
  const index = new Map<string, RawBackgroundEntry>();
  for (const entry of fluffEntries) {
    const name = entry.name;
    const source = entry.source;
    if (typeof name === "string" && typeof source === "string") {
      index.set(`${name}|${source}`.toLowerCase(), entry);
    }
  }
  return index;
}

function attachFluff(
  raw: RawBackgroundEntry,
  fluffIndex: Map<string, RawBackgroundEntry>,
): RawBackgroundEntry {
  const name = raw.name;
  const source = raw.source;
  if (typeof name !== "string" || typeof source !== "string") return raw;
  if (raw.fluff) return raw;

  const fluffEntry = fluffIndex.get(`${name}|${source}`.toLowerCase());
  if (fluffEntry && raw.hasFluff !== false) {
    return { ...raw, fluff: fluffEntry };
  }
  return raw;
}

export async function getAllDndBackgrounds(): Promise<DndBackground[]> {
  if (cache) return cache;

  const [data, fluffData] = await Promise.all([
    fetchFiveToolsJson<{ background?: RawBackgroundEntry[] }>(
      BACKGROUNDS_JSON_URL,
      "backgrounds.json",
    ),
    fetchFiveToolsJson<{ backgroundFluff?: RawBackgroundEntry[] }>(
      FLUFF_BACKGROUNDS_JSON_URL,
      "fluff-backgrounds.json",
    ),
  ]);

  const rawBackgrounds = Array.isArray(data.background) ? data.background : [];
  const fluffEntries = Array.isArray(fluffData.backgroundFluff)
    ? fluffData.backgroundFluff
    : [];
  const fluffIndex = buildFluffIndex(fluffEntries);

  const withFluff = rawBackgrounds.map((raw) => attachFluff(raw, fluffIndex));

  const resolved = resolveByNameSource(
    withFluff as (RawBackgroundEntry & { name: string; source: string })[],
  );

  cache = resolved.map((raw) => mapDndBackground(raw));
  buildIndexes(cache);
  return cache;
}

export async function getListDndBackgrounds(): Promise<DndBackground[]> {
  await getAllDndBackgrounds();
  return listCache ?? [];
}

export async function getDndBackgroundsByName(
  name: string,
): Promise<DndBackground[]> {
  await getAllDndBackgrounds();
  const group = byNameIndex?.get(name) ?? [];
  return [...group].sort((a, b) => a.source.localeCompare(b.source));
}

export async function getDndBackgroundById(
  id: string,
): Promise<DndBackground | undefined> {
  await getAllDndBackgrounds();
  return byIdIndex?.get(id);
}

export function clearDndBackgroundCache(): void {
  cache = null;
  listCache = null;
  byNameIndex = null;
  byIdIndex = null;
}
