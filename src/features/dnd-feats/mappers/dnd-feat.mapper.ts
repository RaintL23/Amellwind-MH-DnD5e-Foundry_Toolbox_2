import type { DndFeat } from "@/shared/types";
import { mapFeat } from "@/features/feats/mappers/feat.mapper";

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
  };
}
