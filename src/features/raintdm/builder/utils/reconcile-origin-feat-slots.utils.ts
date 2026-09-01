import type { BuilderFeatSelection } from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { resolveOriginFeatChooseTarget } from "./origin-feat.constants";

/** Places the chosen origin feat on the correct identity slot once grants are known. */
export function reconcileOriginFeatSlots(input: {
  speciesGrant: OriginFeatGrant | null;
  backgroundGrant: OriginFeatGrant | null;
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  preferBackgroundChoose?: boolean;
  savedUserPick?: BuilderFeatSelection | null;
}): {
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
} {
  const target = resolveOriginFeatChooseTarget(
    input.speciesGrant,
    input.backgroundGrant,
    input.preferBackgroundChoose,
  );
  if (!target) {
    return {
      speciesOriginFeat: input.speciesOriginFeat,
      backgroundOriginFeat: input.backgroundOriginFeat,
    };
  }

  const chosen =
    input.speciesOriginFeat ??
    input.backgroundOriginFeat ??
    input.savedUserPick ??
    null;
  if (!chosen) {
    return { speciesOriginFeat: null, backgroundOriginFeat: null };
  }

  if (target === "species") {
    return { speciesOriginFeat: chosen, backgroundOriginFeat: null };
  }

  return { speciesOriginFeat: null, backgroundOriginFeat: chosen };
}
