import {
  BESTIARY_BASE_URL,
  BESTIARY_INDEX_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { creatureEntityKey } from "./bestiary-hash.utils";
import type {
  BestiaryFile,
  BestiaryIndex,
  BestiaryMetaBlock,
  RawMonster,
} from "./bestiary-raw.types";

const loadedFileNames = new Set<string>();
const loadedSources = new Set<string>();
let indexPromise: Promise<BestiaryIndex> | null = null;
let monsterPool: RawMonster[] = [];

function bestiaryLocalPath(fileName: string): string {
  return `bestiary/${fileName}`;
}

function bestiaryRemoteUrl(fileName: string): string {
  return `${BESTIARY_BASE_URL}/${fileName}`;
}

async function fetchBestiaryFile(fileName: string): Promise<BestiaryFile> {
  return fetchFiveToolsJson<BestiaryFile>(
    bestiaryRemoteUrl(fileName),
    bestiaryLocalPath(fileName),
  );
}

export async function getBestiaryIndex(): Promise<BestiaryIndex> {
  if (!indexPromise) {
    indexPromise = fetchFiveToolsJson<BestiaryIndex>(
      BESTIARY_INDEX_URL,
      bestiaryLocalPath("index.json"),
    );
  }
  return indexPromise;
}

export function getLoadedBestiarySources(): string[] {
  return Array.from(loadedSources).sort((a, b) => a.localeCompare(b));
}

export function getAvailableSources(index: BestiaryIndex): string[] {
  return Object.keys(index).sort((a, b) => a.localeCompare(b));
}

function applyOtherSources(
  monsters: RawMonster[],
  meta?: BestiaryMetaBlock,
): RawMonster[] {
  const remap = meta?.otherSources?.monster;
  if (!remap) return monsters;
  return monsters.map((m) => {
    const newSource = remap[m.source];
    return newSource ? { ...m, source: newSource } : m;
  });
}

function mergeIntoPool(incoming: RawMonster[]): void {
  for (const m of incoming) {
    const key = creatureEntityKey(m.name, m.source);
    const idx = monsterPool.findIndex(
      (existing) => creatureEntityKey(existing.name, existing.source) === key,
    );
    if (idx >= 0) monsterPool[idx] = m;
    else monsterPool.push(m);
  }
}

function resolvePool(): void {
  monsterPool = resolveByNameSource(monsterPool);
}

async function loadFile(fileName: string): Promise<void> {
  if (loadedFileNames.has(fileName)) return;

  const raw = await fetchBestiaryFile(fileName);

  const deps = raw._meta?.dependencies?.monster ?? [];
  const index = await getBestiaryIndex();
  for (const depSource of deps) {
    const depFile = index[depSource];
    if (depFile) await loadFile(depFile);
  }

  const monsters = applyOtherSources(raw.monster ?? [], raw._meta);
  mergeIntoPool(monsters);
  resolvePool();
  loadedFileNames.add(fileName);
}

export async function loadBestiarySource(source: string): Promise<RawMonster[]> {
  if (loadedSources.has(source)) {
    return monsterPool.filter((m) => m.source === source);
  }

  const index = await getBestiaryIndex();
  const fileName = index[source];
  if (!fileName) return [];

  try {
    await loadFile(fileName);
    loadedSources.add(source);
  } catch (err) {
    console.warn(`Failed to load bestiary source ${source}:`, err);
    return [];
  }

  return monsterPool.filter((m) => m.source === source);
}

export async function loadBestiarySources(sources: string[]): Promise<RawMonster[]> {
  await Promise.all(sources.map((s) => loadBestiarySource(s)));
  const sourceSet = new Set(sources);
  return monsterPool.filter((m) => sourceSet.has(m.source));
}

export function getAllRawMonsters(): RawMonster[] {
  return [...monsterPool];
}

export function clearBestiaryBuilderCache(): void {
  loadedFileNames.clear();
  loadedSources.clear();
  monsterPool = [];
  indexPromise = null;
}

export function isSourceLoaded(source: string): boolean {
  return loadedSources.has(source);
}
