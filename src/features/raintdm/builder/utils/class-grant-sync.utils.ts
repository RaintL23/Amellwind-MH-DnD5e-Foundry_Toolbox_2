import type { Class, Subclass } from "@/shared/types";
import type { BuilderMulticlassEntry } from "@/shared/types";
import { detectExpertiseGrants } from "./expertise-detection.utils";
import { buildClassLanguageGrants } from "./class-language-grants.utils";
import { EMPTY_CLASS_GRANTS } from "./grant-sync.constants";

export function buildClassGrantPayload(
  classData: Class | null,
  level: number,
  activeSubclass: Subclass | null,
  multiclassEnabled: boolean,
  multiclassEntries: BuilderMulticlassEntry[],
  multiclassClassData: (Class | null)[],
) {
  if (!classData) return EMPTY_CLASS_GRANTS;

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

  return {
    source: "class" as const,
    skillGrants,
    saveProficiencies: classData.saveProficiencies,
    expertiseGrants,
    toolGrants,
    armorGrants,
    weaponGrants,
    languageGrants: buildClassLanguageGrants(classData, level, activeSubclass),
  };
}
