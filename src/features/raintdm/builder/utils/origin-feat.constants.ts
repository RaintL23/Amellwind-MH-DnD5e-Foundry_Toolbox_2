import type { BuilderFeatSelection, DndFeat } from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";

export const ORIGIN_FEAT_SOURCE_NAME = "Origin Feat";

/** Prefix for Origin Feats granted by optional features (invocations, etc.). */
export const INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX = "Origin Feat · ";

/** Every Amellwind (AGMH) background grants one D&D 2024 Origin Feat of the player's choice. */
export const AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT: Extract<
  OriginFeatGrant,
  { kind: "choose" }
> = {
  kind: "choose",
  categories: ["O"],
  count: 1,
  summary: "Origin Feat of your choice",
};

export function resolveOriginFeatChooseTarget(
  speciesGrant: OriginFeatGrant | null | undefined,
  backgroundGrant: OriginFeatGrant | null | undefined,
): "species" | "background" | null {
  if (speciesGrant?.kind === "choose") return "species";
  if (backgroundGrant?.kind === "choose") return "background";
  return null;
}

export function hasOriginFeatChooseGrant(
  speciesGrant: OriginFeatGrant | null | undefined,
  backgroundGrant: OriginFeatGrant | null | undefined,
): boolean {
  return resolveOriginFeatChooseTarget(speciesGrant, backgroundGrant) !== null;
}

export function formatInvocationOriginFeatSourceName(
  featureName: string,
  duplicateIndex: number,
): string {
  if (duplicateIndex === 0) {
    return `${INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX}${featureName}`;
  }
  return `${INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX}${featureName} (${duplicateIndex + 1})`;
}

export function isInvocationOriginFeatSourceName(name: string): boolean {
  return name.startsWith(INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX);
}

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
