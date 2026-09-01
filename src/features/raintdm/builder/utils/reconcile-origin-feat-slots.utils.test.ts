import { describe, expect, it } from "vitest";
import { AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT } from "@/features/amellwind/backgrounds/constants/origin-feat.constants";
import type { BuilderFeatSelection } from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { reconcileOriginFeatSlots } from "./reconcile-origin-feat-slots.utils";

const sampleFeat: BuilderFeatSelection = {
  id: "alert|xphb",
  name: "Alert",
  source: "dnd2024",
};

const speciesChooseGrant: Extract<OriginFeatGrant, { kind: "choose" }> = {
  kind: "choose",
  categories: ["O"],
  count: 1,
  summary: "Origin Feat of your choice",
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

  it("preserves choose-slot feats when neither side grants a choice", () => {
    const result = reconcileOriginFeatSlots({
      speciesGrant: null,
      backgroundGrant: null,
      speciesOriginFeat: sampleFeat,
      backgroundOriginFeat: null,
    });

    expect(result).toEqual({
      speciesOriginFeat: sampleFeat,
      backgroundOriginFeat: null,
    });
  });

  it("prefers the background choose slot in Amellwind mode when both sides grant a choice", () => {
    const result = reconcileOriginFeatSlots({
      speciesGrant: speciesChooseGrant,
      backgroundGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
      speciesOriginFeat: sampleFeat,
      backgroundOriginFeat: null,
      preferBackgroundChoose: true,
    });

    expect(result).toEqual({
      speciesOriginFeat: null,
      backgroundOriginFeat: sampleFeat,
    });
  });

  it("restores a saved user pick when state slots are temporarily empty", () => {
    const result = reconcileOriginFeatSlots({
      speciesGrant: speciesChooseGrant,
      backgroundGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
      speciesOriginFeat: null,
      backgroundOriginFeat: null,
      preferBackgroundChoose: true,
      savedUserPick: sampleFeat,
    });

    expect(result).toEqual({
      speciesOriginFeat: null,
      backgroundOriginFeat: sampleFeat,
    });
  });
});
