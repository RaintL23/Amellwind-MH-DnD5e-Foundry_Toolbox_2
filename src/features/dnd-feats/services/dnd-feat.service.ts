import type { DndBackgroundFeatRef, DndFeat } from "@/shared/types";
import {
  FEATS_JSON_URL,
  FLUFF_FEATS_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { mapDndFeat } from "../mappers/dnd-feat.mapper";
import { dedupeDndFeatsByName } from "../utils/dnd-feat-dedupe.utils";

let cache: DndFeat[] | null = null;
let listCache: DndFeat[] | null = null;
let byNameIndex: Map<string, DndFeat[]> | null = null;
let byIdIndex: Map<string, DndFeat> | null = null;

function buildIndexes(all: DndFeat[]): void {
  byIdIndex = new Map(all.map((f) => [f.id, f]));

  const byName = new Map<string, DndFeat[]>();
  for (const feat of all) {
    const group = byName.get(feat.name) ?? [];
    group.push(feat);
    byName.set(feat.name, group);
  }
  byNameIndex = byName;
  listCache = dedupeDndFeatsByName(all);
}

type RawFeatEntry = Record<string, unknown>;

function buildFluffIndex(
  fluffEntries: RawFeatEntry[],
): Map<string, RawFeatEntry> {
  const index = new Map<string, RawFeatEntry>();
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
  raw: RawFeatEntry,
  fluffIndex: Map<string, RawFeatEntry>,
): RawFeatEntry {
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

export async function getAllDndFeats(): Promise<DndFeat[]> {
  if (cache) return cache;

  const [data, fluffData] = await Promise.all([
    fetchFiveToolsJson<{ feat?: RawFeatEntry[] }>(
      FEATS_JSON_URL,
      "feats.json",
    ),
    fetchFiveToolsJson<{ featFluff?: RawFeatEntry[] }>(
      FLUFF_FEATS_JSON_URL,
      "fluff-feats.json",
    ),
  ]);

  const rawFeats = Array.isArray(data.feat) ? data.feat : [];
  const fluffEntries = Array.isArray(fluffData.featFluff)
    ? fluffData.featFluff
    : [];
  const fluffIndex = buildFluffIndex(fluffEntries);

  const withFluff = rawFeats.map((raw) => attachFluff(raw, fluffIndex));

  const resolved = resolveByNameSource(
    withFluff as (RawFeatEntry & { name: string; source: string })[],
  );

  cache = resolved.map((raw) => mapDndFeat(raw));
  buildIndexes(cache);
  return cache;
}

export async function getListDndFeats(): Promise<DndFeat[]> {
  await getAllDndFeats();
  return listCache ?? [];
}

export async function getDndFeatsByName(name: string): Promise<DndFeat[]> {
  await getAllDndFeats();
  const group = byNameIndex?.get(name) ?? [];
  return [...group].sort((a, b) => a.source.localeCompare(b.source));
}

export async function getDndFeatById(id: string): Promise<DndFeat | undefined> {
  await getAllDndFeats();
  return byIdIndex?.get(id);
}

export async function resolveDndFeatForRef(
  ref: DndBackgroundFeatRef,
): Promise<DndFeat | undefined> {
  const exact = await getDndFeatById(ref.id);
  if (exact) return exact;

  const variants = await getDndFeatsByName(ref.name);
  if (variants.length === 0) return undefined;

  return (
    variants.find((f) => f.source === ref.source) ??
    variants.find((f) => f.source === "XPHB") ??
    variants[0]
  );
}

export function clearDndFeatCache(): void {
  cache = null;
  listCache = null;
  byNameIndex = null;
  byIdIndex = null;
}
