import { describe, expect, it } from "vitest";
import { AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT } from "@/features/amellwind/backgrounds/constants/origin-feat.constants";
import type { BuilderFeatSelection } from "@/shared/types";
import { reconcileOriginFeatSlots } from "./reconcile-origin-feat-slots.utils";

const sampleFeat: BuilderFeatSelection = {
  id: "alert|xphb",
  name: "Alert",
  source: "dnd2024",
};

describe("reconcileOriginFeatSlots", () => {
  it("moves a misrouted species selection onto the background choose slot", () => {
    const result = reconcileOriginFeatSlots({
      speciesGrant: null,
      backgroundGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
      speciesOriginFeat: sampleFeat,
      backgroundOriginFeat: null,
    });

    expect(result).toEqual({
      speciesOriginFeat: null,
      backgroundOriginFeat: sampleFeat,
    });
  });

  it("keeps a correctly stored background origin feat", () => {
    const result = reconcileOriginFeatSlots({
      speciesGrant: null,
      backgroundGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
      speciesOriginFeat: null,
      backgroundOriginFeat: sampleFeat,
    });

    expect(result).toEqual({
      speciesOriginFeat: null,
      backgroundOriginFeat: sampleFeat,
    });
  });

  it("clears choose-slot feats when neither side grants a choice", () => {
    const result = reconcileOriginFeatSlots({
      speciesGrant: null,
      backgroundGrant: null,
      speciesOriginFeat: sampleFeat,
      backgroundOriginFeat: null,
    });

    expect(result).toEqual({
      speciesOriginFeat: null,
      backgroundOriginFeat: null,
    });
  });
});
