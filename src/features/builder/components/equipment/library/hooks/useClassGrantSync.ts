import { useEffect, useMemo } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/builder/hooks/useBuilderSelections";
import { buildClassGrantPayload } from "@/features/builder/utils/class-grant-sync.utils";
import { computeFeatureChoiceGrants } from "@/features/builder/utils/feature-choice-grants.utils";
import { resolveOptionalFeatureProgressions } from "@/features/builder/utils/class-optional-features.utils";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";

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

  const activeSubclass =
    classData && subclass
      ? (subclassesForClassVariant(classData).find(
          (sc) => sc.id === subclass.id,
        ) ?? null)
      : null;

  const level = multiclassEnabled ? primaryClassLevel : character.level;

  const progressions = useMemo(
    () => resolveOptionalFeatureProgressions(classData, activeSubclass, level).map((r) => r.progression),
    [classData, activeSubclass, level],
  );

  useEffect(() => {
    const base = buildClassGrantPayload(
      classData,
      level,
      activeSubclass,
      multiclassEnabled,
      multiclassEntries,
      multiclassClassData,
    );

    const featureChoiceGrants = computeFeatureChoiceGrants(
      optionalFeatureSelections ?? {},
      progressions,
    );

    applyIdentityGrants({
      ...base,
      armorGrants: [...base.armorGrants, ...featureChoiceGrants.armorGrants],
      weaponGrants: [...base.weaponGrants, ...featureChoiceGrants.weaponGrants],
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
  ]);
}
