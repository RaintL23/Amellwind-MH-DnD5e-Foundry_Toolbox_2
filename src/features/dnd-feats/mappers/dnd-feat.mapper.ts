import type { DndFeat, SubclassSpellBlock } from "@/shared/types";
import { mapFeat } from "@/features/feats/mappers/feat.mapper";

function mapAdditionalSpells(raw: unknown): SubclassSpellBlock[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((block) => {
    const entry = block as SubclassSpellBlock & { name?: string };
    return {
      name: typeof entry.name === "string" ? entry.name : undefined,
      prepared: entry.prepared,
      known: entry.known,
      expanded: entry.expanded,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDndFeat(raw: any): DndFeat {
  const base = mapFeat(raw);
  const category =
    typeof raw.category === "string" ? raw.category : undefined;

  return {
    ...base,
    category,
    isOriginFeat: category?.toUpperCase() === "O",
    repeatable: raw.repeatable === true || base.repeatable,
    srd52: raw.srd52 === true,
    basicRules2024: raw.basicRules2024 === true,
    additionalSpells: mapAdditionalSpells(raw.additionalSpells),
  };
}
