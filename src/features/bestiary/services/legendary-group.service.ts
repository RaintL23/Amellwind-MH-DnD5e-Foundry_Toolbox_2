import { LEGENDARY_GROUPS_URL } from "@/shared/constants/api.constants";
import type { LegendaryGroup } from "@/shared/types/bestiary-creature.types";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import { resolveByNameSource } from "@/shared/utils/entity-copy.utils";
import { parseEntries } from "@/shared/utils/fivetools-parser";
import { toCreatureHash } from "../utils/bestiary-hash.utils";
import type { LegendaryGroupsFile, RawLegendaryGroup } from "../utils/bestiary-raw.types";

let legendaryGroups: LegendaryGroup[] | null = null;

function bestiaryLocalPath(fileName: string): string {
  return `bestiary/${fileName}`;
}

function mapLegendaryEntries(entries: unknown[] | undefined): string[] {
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => (typeof e === "string" ? e : parseEntries([e])));
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
  return legendaryGroups;
}

export async function getLegendaryGroupForMonster(
  ref: { name: string; source: string },
): Promise<LegendaryGroup | undefined> {
  const groups = await getLegendaryGroups();
  const hash = toCreatureHash(ref.name, ref.source);
  return groups.find((g) => toCreatureHash(g.name, g.source) === hash);
}

export function clearLegendaryCache(): void {
  legendaryGroups = null;
}
