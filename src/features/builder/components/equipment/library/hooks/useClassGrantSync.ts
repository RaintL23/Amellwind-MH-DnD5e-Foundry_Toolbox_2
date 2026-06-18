import { useEffect, useMemo, useState } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/builder/hooks/useBuilderSelections";
import { buildClassGrantPayload } from "@/features/builder/utils/class-grant-sync.utils";
import { computeAllClassEquipmentGrants } from "@/features/builder/utils/feature-choice-grants.utils";
import { resolveOptionalFeatureProgressions } from "@/features/builder/utils/class-optional-features.utils";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { getAllDndFeats } from "@/features/dnd-feats/services/dnd-feat.service";

/** Syncs class-derived proficiencies whenever class, level, or subclass changes. */
export function useClassGrantSync() {
  const {
    character,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    applyIdentityGrants,
    optionalFeatureSelections,
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();
  const [optionalCatalogLoaded, setOptionalCatalogLoaded] = useState(false);
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
        setOptionalCatalogLoaded(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSubclass =
    classData && subclass
      ? (subclassesForClassVariant(classData).find(
          (sc) => sc.id === subclass.id,
        ) ?? null)
      : null;

  const level = multiclassEnabled ? primaryClassLevel : character.level;

  const progressions = useMemo(
    () =>
      resolveOptionalFeatureProgressions(classData, activeSubclass, level).map(
        (r) => r.progression,
      ),
    [classData, activeSubclass, level],
  );

  useEffect(() => {
    if (!optionalCatalogLoaded) return;

    const base = buildClassGrantPayload(
      classData,
      level,
      activeSubclass,
      multiclassEnabled,
      multiclassEntries,
      multiclassClassData,
    );

    const featureChoiceGrants = computeAllClassEquipmentGrants(
      optionalFeatureSelections ?? {},
      progressions,
      classData,
      activeSubclass,
      level,
      optionalCatalog,
      featCatalog,
    );

    applyIdentityGrants({
      ...base,
      armorGrants: [...base.armorGrants, ...featureChoiceGrants.armorGrants],
      weaponGrants: [...base.weaponGrants, ...featureChoiceGrants.weaponGrants],
      toolGrants: [...base.toolGrants, ...featureChoiceGrants.toolGrants],
    });
  }, [
    classData,
    level,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    activeSubclass,
    applyIdentityGrants,
    optionalFeatureSelections,
    progressions,
    optionalCatalog,
    featCatalog,
    optionalCatalogLoaded,
  ]);
}
