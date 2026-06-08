import type { BuilderFeatSelection, DndFeat } from "@/shared/types";

export function dndFeatToBuilderSelection(feat: DndFeat): BuilderFeatSelection {
  return {
    id: feat.id,
    name: feat.name,
    source:
      feat.source === "XPHB" || feat.basicRules2024 || feat.srd52
        ? "dnd2024"
        : "dnd2014",
  };
}
