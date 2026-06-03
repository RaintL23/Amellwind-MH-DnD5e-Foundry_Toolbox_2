import { LEGENDARY_GROUPS_URL } from "@/shared/constants/api.constants";
import type { LegendaryGroup } from "@/shared/types/bestiary-creature.types";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { mapStatBlockEntries } from "@/shared/utils/statblock-entries.mapper";
import { toCreatureHash } from "../utils/bestiary-hash.utils";
import type { LegendaryGroupsFile, RawLegendaryGroup } from "../utils/bestiary-raw.types";

let legendaryGroups: LegendaryGroup[] | null = null;
let legendaryByHash: Map<string, LegendaryGroup> | null = null;

function bestiaryLocalPath(fileName: string): string {
  return `bestiary/${fileName}`;
}

function mapLegendaryEntries(entries: unknown[] | undefined) {
  if (!Array.isArray(entries)) return [];
  return mapStatBlockEntries(entries);
}

function mapLegendaryGroup(raw: RawLegendaryGroup): LegendaryGroup {
  return {
    name: raw.name,
    source: raw.source,
    lairActions: mapLegendaryEntries(raw.lairActions),
    regionalEffects: mapLegendaryEntries(raw.regionalEffects),
  };
}

export async function getLegendaryGroups(): Promise<LegendaryGroup[]> {
  if (legendaryGroups) return legendaryGroups;

  const data = await fetchFiveToolsJson<LegendaryGroupsFile>(
    LEGENDARY_GROUPS_URL,
    bestiaryLocalPath("legendarygroups.json"),
  );

  const raw = resolveByNameSource(data.legendaryGroup ?? []) as RawLegendaryGroup[];
  legendaryGroups = raw.map(mapLegendaryGroup);
  legendaryByHash = new Map(
    legendaryGroups.map((g) => [toCreatureHash(g.name, g.source), g]),
  );
  return legendaryGroups;
}

export async function getLegendaryGroupForMonster(
  ref: { name: string; source: string },
): Promise<LegendaryGroup | undefined> {
  if (!legendaryByHash) {
    await getLegendaryGroups();
  }
  return legendaryByHash?.get(toCreatureHash(ref.name, ref.source));
}

export function clearLegendaryCache(): void {
  legendaryGroups = null;
  legendaryByHash = null;
}
