import { useEffect, useMemo, useState } from "react";
import type {
  BuilderOptionalFeatureSelections,
  Class,
  Subclass,
} from "@/shared/types";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { resolveOptionalFeatureProgressions } from "../utils/class-optional-features.utils";
import {
  resolveFeatureChoiceSpellGrants,
  resolveOptionalFeatureSpells,
} from "../utils/optional-feature-spells.utils";
import type { SubclassSpellGrant } from "../utils/subclass-spells.utils";

export function useOptionalFeatureSpellGrants(
  optionalFeatureSelections: BuilderOptionalFeatureSelections,
  characterLevel: number,
  classData: Class | null = null,
  subclassData: Subclass | null = null,
): SubclassSpellGrant[] {
  const [grants, setGrants] = useState<SubclassSpellGrant[]>([]);
  const [optionalCatalog, setOptionalCatalog] = useState<
    Awaited<ReturnType<typeof getAllDndOptionalFeatures>>
  >([]);

  const progressions = useMemo(
    () =>
      classData
        ? resolveOptionalFeatureProgressions(
            classData,
            subclassData,
            characterLevel,
          ).map((entry) => entry.progression)
        : [],
    [classData, subclassData, characterLevel],
  );

  useEffect(() => {
    let cancelled = false;

    getAllDndOptionalFeatures().then((catalog) => {
      if (cancelled) return;
      setOptionalCatalog(catalog);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const flatSelections = Object.values(optionalFeatureSelections)
      .flat()
      .filter((selection): selection is NonNullable<typeof selection> => selection !== null);

    if (flatSelections.length === 0 && progressions.length === 0) {
      setGrants([]);
      return;
    }

    const optionalGrants = resolveOptionalFeatureSpells(
      optionalCatalog,
      flatSelections,
      characterLevel,
    );
    const featureChoiceGrants = resolveFeatureChoiceSpellGrants(
      optionalFeatureSelections,
      progressions,
      optionalCatalog,
      characterLevel,
    );

    setGrants([...optionalGrants, ...featureChoiceGrants]);
  }, [
    optionalFeatureSelections,
    characterLevel,
    optionalCatalog,
    progressions,
  ]);

  return grants;
}
