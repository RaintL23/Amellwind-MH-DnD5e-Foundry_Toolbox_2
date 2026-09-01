import type { AbilityKey, BuilderFeatSelection, DndFeat } from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { buildFeatAbilityIncreaseChoices } from "./feat-ability-increase-choices.utils";

export { AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT } from "@/features/amellwind/backgrounds/constants/origin-feat.constants";

export const ORIGIN_FEAT_SOURCE_NAME = "Origin Feat";

/** Prefix for Origin Feats granted by optional features (invocations, etc.). */
export const INVOCATION_ORIGIN_FEAT_SOURCE_PREFIX = "Origin Feat · ";

export function resolveOriginFeatChooseTarget(
  speciesGrant: OriginFeatGrant | null | undefined,
  backgroundGrant: OriginFeatGrant | null | undefined,
  preferBackgroundChoose = false,
): "species" | "background" | null {
  if (preferBackgroundChoose && backgroundGrant?.kind === "choose") {
    return "background";
  }
  if (speciesGrant?.kind === "choose") return "species";
  if (backgroundGrant?.kind === "choose") return "background";
  return null;
}

/** Resolves the pick target even before async grants finish loading (AGMH background rule). */
export function resolveEffectiveOriginFeatChooseTarget(
  speciesGrant: OriginFeatGrant | null | undefined,
  backgroundGrant: OriginFeatGrant | null | undefined,
  options?: {
    preferBackgroundChoose?: boolean;
    hasBackground?: boolean;
  },
): "species" | "background" | null {
  const target = resolveOriginFeatChooseTarget(
    speciesGrant,
    backgroundGrant,
    options?.preferBackgroundChoose,
  );
  if (target) return target;
  if (options?.preferBackgroundChoose && options.hasBackground) {
    return "background";
  }
  return null;
}

export function hasOriginFeatChooseGrant(
  speciesGrant: OriginFeatGrant | null | undefined,
  backgroundGrant: OriginFeatGrant | null | undefined,
  preferBackgroundChoose = false,
  hasBackground = false,
): boolean {
  return (
    resolveEffectiveOriginFeatChooseTarget(speciesGrant, backgroundGrant, {
      preferBackgroundChoose,
      hasBackground,
    }) !== null
  );
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

export function dndFeatToBuilderSelection(
  feat: DndFeat,
  options?: {
    randomizeAbilityIncreases?: boolean;
    abilityPriority?: AbilityKey[];
  },
): BuilderFeatSelection {
  const selection: BuilderFeatSelection = {
    id: feat.id,
    name: feat.name,
    source:
      feat.source === "XPHB" || feat.basicRules2024 || feat.srd52
        ? "dnd2024"
        : "dnd2014",
  };

  if (feat.abilityIncreases.length > 0) {
    selection.abilityIncreaseChoices = buildFeatAbilityIncreaseChoices(
      feat.abilityIncreases,
      {
        randomize: options?.randomizeAbilityIncreases === true,
        abilityPriority: options?.abilityPriority,
      },
    );
  }

  return selection;
}
