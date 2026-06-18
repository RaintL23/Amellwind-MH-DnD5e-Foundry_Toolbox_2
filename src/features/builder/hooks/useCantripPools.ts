import { useEffect, useMemo, useState } from "react";
import type {
  BuilderFeatSelection,
  BuilderOptionalFeatureSelections,
  Class,
  Subclass,
} from "@/shared/types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { getAllDndFeats } from "@/features/dnd-feats/services/dnd-feat.service";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { resolveOptionalFeatureProgressions } from "@/features/builder/utils/class-optional-features.utils";
import {
  resolveBonusCantripPools,
  sumBonusCantripPoolCounts,
  type CantripPoolDefinition,
} from "@/features/builder/utils/cantrip-pools.utils";

export interface CantripPoolsState {
  bonusPools: CantripPoolDefinition[];
  /** @deprecated Use bonusPools — kept for callers not yet migrated. */
  cantripBonus: number;
  ready: boolean;
}

export function useCantripPools(
  optionalFeatureSelections: BuilderOptionalFeatureSelections,
  classData: Class | null,
  subclassData: Subclass | null,
  level: number,
  options: {
    speciesOriginFeat?: BuilderFeatSelection | null;
    backgroundOriginFeat?: BuilderFeatSelection | null;
    speciesOriginFeatGrant?: OriginFeatGrant | null;
    backgroundOriginFeatGrant?: OriginFeatGrant | null;
    featSelections?: (BuilderFeatSelection | null)[];
  } = {},
): CantripPoolsState {
  const [ready, setReady] = useState(false);
  const [optionalCatalog, setOptionalCatalog] = useState<
    Awaited<ReturnType<typeof getAllDndOptionalFeatures>>
  >([]);
  const [featCatalog, setFeatCatalog] = useState<
    Awaited<ReturnType<typeof getAllDndFeats>>
  >([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getAllDndOptionalFeatures(), getAllDndFeats()]).then(
      ([optionalFeatures, feats]) => {
        if (cancelled) return;
        setOptionalCatalog(optionalFeatures);
        setFeatCatalog(feats);
        setReady(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const progressions = useMemo(
    () =>
      resolveOptionalFeatureProgressions(classData, subclassData, level).map(
        (entry) => entry.progression,
      ),
    [classData, subclassData, level],
  );

  const bonusPools = useMemo(() => {
    if (!ready) return [];
    return resolveBonusCantripPools({
      optionalFeatureSelections,
      progressions,
      optionalCatalog,
      featCatalog,
      classData,
      subclass: subclassData,
      level,
      speciesOriginFeat: options.speciesOriginFeat,
      backgroundOriginFeat: options.backgroundOriginFeat,
      speciesOriginFeatGrant: options.speciesOriginFeatGrant,
      backgroundOriginFeatGrant: options.backgroundOriginFeatGrant,
      featSelections: options.featSelections,
    });
  }, [
    ready,
    optionalFeatureSelections,
    progressions,
    optionalCatalog,
    featCatalog,
    classData,
    subclassData,
    level,
    options.speciesOriginFeat,
    options.backgroundOriginFeat,
    options.speciesOriginFeatGrant,
    options.backgroundOriginFeatGrant,
    options.featSelections,
  ]);

  return {
    bonusPools,
    cantripBonus: sumBonusCantripPoolCounts(bonusPools),
    ready,
  };
}
