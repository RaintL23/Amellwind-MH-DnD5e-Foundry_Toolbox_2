import { Monster, type Entry } from "@/shared/types";
import {
  mapActorCore,
  mapCrString,
  mapEntries,
  type RawActor,
} from "@/shared/mappers/actor-from-raw.mapper";
import { mapStatBlockEntries } from "@/shared/utils/statblock-entries.mapper";
import { sanitizeNamedEntrySection } from "@/shared/utils/statblock-named-entries.sanitize";

/** MHMM dumps often prefix BA names; also catch catalog misfiles still under action. */
const BONUS_ACTION_NAME_RE = /^bonus\s*actions?\s*:?\s*/i;

/** Legacy supplement.json duplicated mythic entries under legendary with this prefix. */
const MYTHIC_PREFIX_RE = /^mythic\s*:\s*/i;

function isBonusActionName(name: string): boolean {
  return BONUS_ACTION_NAME_RE.test(name.trim());
}

function stripBonusActionPrefix(name: string): string {
  const stripped = name.replace(BONUS_ACTION_NAME_RE, "").trim();
  return stripped || name;
}

/**
 * Prefer `raw.bonus`, and lift any `action` entries whose name starts with
 * "Bonus Action" so the UI can render a dedicated Bonus Actions section.
 */
export function partitionMonsterBonusActions(
  actions: Entry[],
  fromBonusField: Entry[],
): { actions: Entry[]; bonusActions: Entry[] } {
  const remaining: Entry[] = [];
  const fromActions: Entry[] = [];

  for (const action of actions) {
    if (isBonusActionName(action.name)) {
      fromActions.push({
        ...action,
        name: stripBonusActionPrefix(action.name),
      });
    } else {
      remaining.push(action);
    }
  }

  const byName = new Map<string, Entry>();
  for (const entry of fromBonusField) {
    byName.set(entry.name.toLowerCase(), entry);
  }
  for (const entry of fromActions) {
    const key = entry.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, entry);
  }

  return {
    actions: remaining,
    bonusActions: [...byName.values()],
  };
}

function isMythicPrefixedLegendary(name: string): boolean {
  return MYTHIC_PREFIX_RE.test(name.trim());
}

function stripMythicPrefix(name: string): string {
  const stripped = name.replace(MYTHIC_PREFIX_RE, "").trim();
  return stripped || name;
}

/**
 * Prefer `raw.mythic`, and lift any `legendary` entries prefixed with "Mythic:"
 * so the UI can render a dedicated Mythic Actions section.
 */
export function partitionMonsterMythicActions(
  legendary: Entry[],
  fromMythicField: Entry[],
): { legendaryActions: Entry[]; mythicActions: Entry[] } {
  const remaining: Entry[] = [];
  const fromLegendary: Entry[] = [];

  for (const entry of legendary) {
    if (isMythicPrefixedLegendary(entry.name)) {
      fromLegendary.push({
        ...entry,
        name: stripMythicPrefix(entry.name),
      });
    } else {
      remaining.push(entry);
    }
  }

  const byName = new Map<string, Entry>();
  for (const entry of fromMythicField) {
    byName.set(entry.name.toLowerCase(), entry);
  }
  for (const entry of fromLegendary) {
    const key = entry.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, entry);
  }

  return {
    legendaryActions: remaining,
    mythicActions: [...byName.values()],
  };
}

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
  const fromBonus = mapEntries(sanitizeNamedEntrySection(raw.bonus ?? []));
  const { actions, bonusActions } = partitionMonsterBonusActions(
    core.actions,
    fromBonus,
  );
  const fromMythic = mapEntries(
    sanitizeNamedEntrySection(raw.mythic ?? []),
  );
  const { legendaryActions, mythicActions } = partitionMonsterMythicActions(
    mapEntries(sanitizeNamedEntrySection(raw.legendary ?? [])),
    fromMythic,
  );

  return {
    ...core,
    actions,
    group: Array.isArray(raw.group) ? raw.group : undefined,
    source: String(raw.source ?? ""),
    page: typeof raw.page === "number" ? raw.page : undefined,
    cr,
    environment: Array.isArray(raw.environment) ? raw.environment : undefined,
    bonusActions: bonusActions.length > 0 ? bonusActions : undefined,
    legendaryActions:
      legendaryActions.length > 0 ? legendaryActions : undefined,
    mythicActions: mythicActions.length > 0 ? mythicActions : undefined,
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
