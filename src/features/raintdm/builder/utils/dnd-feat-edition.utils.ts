import type { DndFeat } from "@/shared/types";

/**
 * 2024-rules feats carry a category (O / G / EB / FS…); classic PHB/TCE/XGE
 * entries usually omit it. Also treat explicit 2024 flags / XPHB as 2024.
 */
export function isDnd2024Feat(feat: DndFeat): boolean {
  return (
    (typeof feat.category === "string" && feat.category.trim().length > 0) ||
    feat.basicRules2024 === true ||
    feat.srd52 === true ||
    feat.source === "XPHB"
  );
}
