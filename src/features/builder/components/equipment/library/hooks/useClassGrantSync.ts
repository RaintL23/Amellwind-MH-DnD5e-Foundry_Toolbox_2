import { useEffect } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/builder/hooks/useBuilderSelections";
import { buildClassGrantPayload } from "@/features/builder/utils/class-grant-sync.utils";
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
  } = useCharacterBuilder();
  const { classData } = useSelectedClass();

  const activeSubclass =
    classData && subclass
      ? (subclassesForClassVariant(classData).find(
          (sc) => sc.id === subclass.id,
        ) ?? null)
      : null;

  useEffect(() => {
    const level = multiclassEnabled ? primaryClassLevel : character.level;
    applyIdentityGrants(
      buildClassGrantPayload(
        classData,
        level,
        activeSubclass,
        multiclassEnabled,
        multiclassEntries,
        multiclassClassData,
      ),
    );
  }, [
    classData,
    character.level,
    primaryClassLevel,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    activeSubclass,
    applyIdentityGrants,
  ]);
}
