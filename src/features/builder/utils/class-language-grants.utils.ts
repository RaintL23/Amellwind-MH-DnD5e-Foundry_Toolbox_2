import type { Class, Subclass } from "@/shared/types";
import type { NamedProficiencyGrant, ProficiencySource } from "@/shared/types/proficiency.types";
import { mergeProgressionWithSubclass } from "@/features/classes/mappers/class.mapper";
import {
  mergeLanguageGrants,
  parseLanguageGrantsFromFeatureText,
} from "@/shared/utils/language-grant.parser";

/**
 * Class language grants from startingProficiencies plus feature text
 * (e.g. Rogue XPHB Thieves' Cant: fixed + 1 choose).
 */
export function buildClassLanguageGrants(
  classData: Class,
  level: number,
  subclass: Subclass | null,
): NamedProficiencyGrant[] {
  const classSource: ProficiencySource = {
    type: "class",
    name: classData.name,
  };
  const progression = mergeProgressionWithSubclass(
    classData.progression,
    subclass,
  );

  const fromFeatures: NamedProficiencyGrant[] = [];

  for (const row of progression) {
    if (row.level > level) continue;
    for (const feature of row.features) {
      const text = feature.description.join(" ");
      if (!/\blanguage|thieves' cant\b/i.test(text)) continue;

      const featureSource: ProficiencySource = {
        ...classSource,
        name: `${classData.name} — ${feature.displayName ?? feature.name}`,
      };
      fromFeatures.push(
        ...parseLanguageGrantsFromFeatureText(text, featureSource),
      );
    }
  }

  return mergeLanguageGrants(classData.languageGrants, fromFeatures);
}
