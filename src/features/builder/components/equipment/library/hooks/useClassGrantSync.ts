import { useEffect } from "react";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useSelectedClass } from "@/features/builder/hooks/useBuilderSelections";
import { detectExpertiseGrants } from "@/features/builder/utils/expertise-detection.utils";
import { buildClassLanguageGrants } from "@/features/builder/utils/class-language-grants.utils";
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

    const level = multiclassEnabled ? primaryClassLevel : character.level;
    const expertiseGrants = detectExpertiseGrants(classData, level);

    let skillGrants = [...classData.skillChoiceGrants];
    let toolGrants = [...classData.toolGrants];
    let armorGrants = [...classData.armorGrants];
    let weaponGrants = [...classData.weaponGrants];

    if (multiclassEnabled) {
      for (let i = 0; i < multiclassEntries.length; i++) {
        const entry = multiclassEntries[i];
        const entryClassData = multiclassClassData[i];
        if (!entry.classRef || !entryClassData || entry.level < 1) continue;

        const mc = entryClassData.multiclassProficiencies;
        if (mc) {
          skillGrants = [...skillGrants, ...mc.skillChoiceGrants];
          toolGrants = [...toolGrants, ...mc.toolGrants];
          armorGrants = [...armorGrants, ...mc.armorGrants];
          weaponGrants = [...weaponGrants, ...mc.weaponGrants];
        }
      }
    }

    applyIdentityGrants({
      source: "class",
      skillGrants,
      saveProficiencies: classData.saveProficiencies,
      expertiseGrants,
      toolGrants,
      armorGrants,
      weaponGrants,
      languageGrants: buildClassLanguageGrants(
        classData,
        level,
        activeSubclass,
      ),
    });
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
