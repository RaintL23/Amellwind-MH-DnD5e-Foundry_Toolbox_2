import { useEffect, useMemo, useState } from "react";
import type {
  BuilderOptionalFeatureSelections,
  Class,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import { getAllDndFeats } from "@/features/dnd-feats/services/dnd-feat.service";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { computeAllClassEquipmentGrants } from "@/features/builder/utils/feature-choice-grants.utils";
import { resolveOptionalFeatureProgressions } from "@/features/builder/utils/class-optional-features.utils";

export interface FeatureChoiceSpellGrants {
  cantripBonus: number;
  progressions: OptionalFeatureProgression[];
  ready: boolean;
}

/**
 * Cantrip/spell bonuses from selected feature choices, optional features, and
 * granted class/subclass feature text.
 */
export function useFeatureChoiceSpellGrants(
  optionalFeatureSelections: BuilderOptionalFeatureSelections,
  classData: Class | null,
  subclassData: Subclass | null,
  level: number,
): FeatureChoiceSpellGrants {
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

  const cantripBonus = useMemo(() => {
    if (!ready) return 0;
    return computeAllClassEquipmentGrants(
      optionalFeatureSelections,
      progressions,
      classData,
      subclassData,
      level,
      optionalCatalog,
      featCatalog,
    ).cantripBonus;
  }, [
    ready,
    optionalFeatureSelections,
    progressions,
    classData,
    subclassData,
    level,
    optionalCatalog,
    featCatalog,
  ]);

  return { cantripBonus, progressions, ready };
}
