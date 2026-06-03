import { BESTIARY_BASE_URL } from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import type { BestiaryCreature, LegendaryGroup } from "@/shared/types/bestiary-creature.types";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { mapStatBlockEntries } from "@/shared/utils/statblock-entries.mapper";
import { toCreatureHash } from "../utils/bestiary-hash.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

interface MonsterFluffFile {
  monsterFluff?: Raw[];
}

const LAIR_NAMES = new Set(["lair actions", "lair action"]);
const REGIONAL_NAMES = new Set(["regional effects", "regional effect"]);

const fluffBySource = new Map<string, Map<string, Raw>>();

function bestiaryLocalPath(fileName: string): string {
  return `bestiary/${fileName}`;
}

function fluffFileName(source: string): string {
  return `fluff-bestiary-${source.toLowerCase()}.json`;
}

async function loadFluffForSource(source: string): Promise<Map<string, Raw> | undefined> {
  const cached = fluffBySource.get(source);
  if (cached) return cached;

  const fileName = fluffFileName(source);
  try {
    const data = await fetchFiveToolsJson<MonsterFluffFile>(
      `${BESTIARY_BASE_URL}/${fileName}`,
      bestiaryLocalPath(fileName),
    );
    const list = resolveByNameSource(
      (data.monsterFluff ?? []).filter(
        (e): e is Raw & { name: string; source: string } =>
          typeof e?.name === "string" && typeof e?.source === "string",
      ),
    );
    const index = new Map(
      list.map((e) => [toCreatureHash(e.name, e.source), e as Raw]),
    );
    fluffBySource.set(source, index);
    return index;
  } catch {
    return undefined;
  }
}

function sectionMatches(name: string, targets: Set<string>): boolean {
  return targets.has(name.trim().toLowerCase());
}

function findSectionEntries(entries: unknown[], targets: Set<string>): unknown[] | null {
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Raw;
    const name = typeof e.name === "string" ? e.name : "";
    if (
      sectionMatches(name, targets) &&
      Array.isArray(e.entries) &&
      (e.type === "entries" || e.type === "section" || !e.type)
    ) {
      return e.entries as unknown[];
    }
    if (Array.isArray(e.entries)) {
      const found = findSectionEntries(e.entries as unknown[], targets);
      if (found) return found;
    }
  }
  return null;
}

function extractLegendaryFromFluff(fluff: Raw): LegendaryGroup | null {
  const entries = Array.isArray(fluff.entries) ? (fluff.entries as unknown[]) : [];
  const lairRaw = findSectionEntries(entries, LAIR_NAMES);
  const regionalRaw = findSectionEntries(entries, REGIONAL_NAMES);

  if (!lairRaw?.length && !regionalRaw?.length) return null;

  return {
    name: String(fluff.name ?? ""),
    source: String(fluff.source ?? ""),
    lairActions: lairRaw ? mapStatBlockEntries(lairRaw) : [],
    regionalEffects: regionalRaw ? mapStatBlockEntries(regionalRaw) : [],
  };
}

export async function getLairFromFluff(
  creature: BestiaryCreature,
): Promise<LegendaryGroup | undefined> {
  const index = await loadFluffForSource(creature.source);
  if (!index) return undefined;

  const fluff = index.get(toCreatureHash(creature.name, creature.source));
  if (!fluff) return undefined;

  return extractLegendaryFromFluff(fluff) ?? undefined;
}

export function clearFluffLairCache(): void {
  fluffBySource.clear();
}
