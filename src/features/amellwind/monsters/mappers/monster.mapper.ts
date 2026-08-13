import { Monster } from "@/shared/types";
import {
  mapActorCore,
  mapCrString,
  mapEntries,
  type RawActor,
} from "@/shared/mappers/actor-from-raw.mapper";
import { mapStatBlockEntries } from "@/shared/utils/statblock-entries.mapper";

function mapFluffText(fluff: unknown): string {
  if (typeof fluff !== "object" || fluff === null) return "";
  const f = fluff as RawActor;
  if (!Array.isArray(f.entries)) return "";
  return f.entries
    .filter((e: unknown) => typeof e === "string")
    .join(" ");
}

function mapMonsterBio(fluff: unknown) {
  if (typeof fluff !== "object" || fluff === null) return undefined;
  const f = fluff as RawActor;
  if (!Array.isArray(f.entries)) return undefined;

  const bioEntries = f.entries.filter((entry: unknown) => {
    if (typeof entry === "string") return true;
    if (typeof entry !== "object" || entry === null) return false;
    return (entry as RawActor).type !== "inset";
  });

  if (bioEntries.length === 0) return undefined;
  const content = mapStatBlockEntries(bioEntries);
  return content.length > 0 ? content : undefined;
}

function mapLairCr(raw: RawActor): string | undefined {
  if (typeof raw.cr === "object" && raw.cr !== null && raw.cr.lair != null) {
    return String(raw.cr.lair);
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMonster(raw: any): Monster {
  const core = mapActorCore(raw as RawActor);
  const cr = mapCrString(raw as RawActor);

  return {
    ...core,
    group: Array.isArray(raw.group) ? raw.group : undefined,
    source: String(raw.source ?? ""),
    page: typeof raw.page === "number" ? raw.page : undefined,
    cr,
    environment: Array.isArray(raw.environment) ? raw.environment : undefined,
    legendaryActions: mapEntries(raw.legendary ?? []),
    loot: raw.fluff ? { rolls: extractRolls(raw.fluff) } : undefined,
    fluff: mapFluffText(raw.fluff),
    bio: mapMonsterBio(raw.fluff),
    lairCr: mapLairCr(raw as RawActor),
  };
}

function extractRolls(fluff: unknown): number {
  if (typeof fluff !== "object" || fluff === null) return 0;
  const f = fluff as RawActor;
  if (!Array.isArray(f.entries)) return 0;
  const inset = f.entries.find((e: unknown) =>
    typeof e === "object" && e !== null && (e as RawActor).type === "inset",
  );
  if (!inset) return 0;
  const ins = inset as RawActor;
  const tables = (ins.entries ?? []).filter((e: RawActor) => e.type === "table");
  const header = tables.find((t: RawActor) => !t.colLabels);
  return parseInt(String(header?.rows?.[0]?.[3] ?? 0)) || 0;
}
