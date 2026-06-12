import { useEffect } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/builder/hooks/useSelectedClass";
import { detectExpertiseGrants } from "@/features/builder/utils/expertise-detection.utils";
import { buildClassLanguageGrants } from "@/features/builder/utils/class-language-grants.utils";
import { subclassesForClassVariant } from "@/features/classes/utils/class-subclass.utils";

/** Syncs class-derived proficiencies whenever class, level, or subclass changes. */
export function useClassGrantSync() {
  const { character, subclass, applyIdentityGrants } = useCharacterBuilder();
  const { classData } = useSelectedClass();

  const activeSubclass =
    classData && subclass
      ? (subclassesForClassVariant(classData).find(
          (sc) => sc.id === subclass.id,
        ) ?? null)
      : null;

  useEffect(() => {
    if (!classData) {
      applyIdentityGrants({
        source: "class",
        skillGrants: [],
        saveProficiencies: [],
        expertiseGrants: [],
        toolGrants: [],
        armorGrants: [],
        weaponGrants: [],
        languageGrants: [],
      });
      return;
    }

    const level = character.level;
    const expertiseGrants = detectExpertiseGrants(classData, level);
    applyIdentityGrants({
      source: "class",
      skillGrants: classData.skillChoiceGrants,
      saveProficiencies: classData.saveProficiencies,
      expertiseGrants,
      toolGrants: classData.toolGrants,
      armorGrants: classData.armorGrants,
      weaponGrants: classData.weaponGrants,
      languageGrants: buildClassLanguageGrants(
        classData,
        level,
        activeSubclass,
      ),
    });
  }, [classData, character.level, activeSubclass, applyIdentityGrants]);
}
