import type { DamageType } from "@/shared/types";
import type {
  DefenseGrant,
  DefenseKind,
  ProficiencySource,
} from "@/shared/types/proficiency.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const DAMAGE_TYPES: DamageType[] = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

function toDamageType(value: string): DamageType | null {
  const normalized = value.trim().toLowerCase();
  return DAMAGE_TYPES.includes(normalized as DamageType)
    ? (normalized as DamageType)
    : null;
}

export function formatDamageTypeLabel(type: DamageType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function parseChooseCount(choose: Raw): number {
  if (typeof choose.count === "number") return choose.count;
  if (typeof choose.amount === "number") return choose.amount;
  return 1;
}

/**
 * Parse 5etools resist / immune arrays into structured defense grants.
 */
export function parseDefenseBlocks(
  blocks: unknown[],
  defenseKind: DefenseKind,
  source: ProficiencySource,
): DefenseGrant[] {
  const grants: DefenseGrant[] = [];
  if (!Array.isArray(blocks)) return grants;

  for (const block of blocks) {
    if (typeof block === "string") {
      const type = toDamageType(block);
      if (type) {
        grants.push({ kind: "fixed", types: [type], defenseKind, source });
      }
      continue;
    }

    if (typeof block !== "object" || block === null) continue;
    const raw = block as Raw;

    if (Array.isArray(raw.resist)) {
      const types = (raw.resist as unknown[])
        .map((item) => toDamageType(String(item)))
        .filter(Boolean) as DamageType[];
      if (types.length) {
        grants.push({ kind: "fixed", types, defenseKind: "resistance", source });
      }
      continue;
    }

    const choose = raw.choose as Raw | undefined;
    if (choose && Array.isArray(choose.from)) {
      const from = (choose.from as unknown[])
        .map((item) => toDamageType(String(item)))
        .filter(Boolean) as DamageType[];
      if (from.length) {
        grants.push({
          kind: "choose",
          from,
          count: parseChooseCount(choose),
          defenseKind,
          source,
        });
      }
    }
  }

  return grants;
}

export function getPendingDefenseChoiceGrants(
  grants: DefenseGrant[],
): Array<{
  kind: "choose";
  from: DamageType[];
  count: number;
  defenseKind: DefenseKind;
  source: ProficiencySource;
}> {
  return grants.filter(
    (g): g is Extract<DefenseGrant, { kind: "choose" }> => g.kind === "choose",
  );
}

export function resolveFixedDefenseGrants(
  grants: DefenseGrant[],
): Array<{ type: DamageType; defenseKind: DefenseKind; source: ProficiencySource }> {
  const result: Array<{
    type: DamageType;
    defenseKind: DefenseKind;
    source: ProficiencySource;
  }> = [];

  for (const grant of grants) {
    if (grant.kind === "fixed") {
      for (const type of grant.types) {
        result.push({ type, defenseKind: grant.defenseKind, source: grant.source });
      }
    }
  }

  return result;
}
