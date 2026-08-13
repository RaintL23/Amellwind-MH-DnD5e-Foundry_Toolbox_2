import type { DndBackgroundEdition } from "@/shared/types/dnd-background.types";
import type {
  NamedProficiencyGrant,
  ProficiencySource,
} from "@/shared/types/proficiency.types";
import {
  resolveFixedNamedGrants,
  STANDARD_LANGUAGES,
} from "@/shared/utils/named-proficiency.parser";

/** Display text when 2024 backgrounds omit languageProficiencies in source data. */
export const DND_2024_BACKGROUND_LANGUAGE_SUMMARY =
  "Common; 1 standard language of your choice";

export function isDnd2024Background(
  edition?: DndBackgroundEdition,
): boolean {
  return edition === "2024";
}

function grantIncludesCommon(grants: NamedProficiencyGrant[]): boolean {
  return resolveFixedNamedGrants(grants).some(
    ({ item }) => item.toLowerCase() === "common",
  );
}

function grantIncludesAdditionalLanguage(
  grants: NamedProficiencyGrant[],
): boolean {
  const hasChoice = grants.some(
    (grant) => grant.kind === "choose" || grant.kind === "any",
  );
  if (hasChoice) return true;

  return resolveFixedNamedGrants(grants).some(
    ({ item }) => item.toLowerCase() !== "common",
  );
}

/**
 * D&D 2024 backgrounds grant Common plus one additional language.
 * Official XPHB entries often omit languageProficiencies in 5etools data.
 */
export function applyDnd2024BackgroundLanguageGrants(
  grants: NamedProficiencyGrant[],
  source: ProficiencySource,
): { grants: NamedProficiencyGrant[]; appliedDefaults: boolean } {
  const result = [...grants];
  let appliedDefaults = false;

  if (!grantIncludesCommon(result)) {
    result.push({ kind: "fixed", items: ["Common"], source });
    appliedDefaults = true;
  }

  if (!grantIncludesAdditionalLanguage(result)) {
    result.push({
      kind: "any",
      count: 1,
      label: "Standard language",
      options: [...STANDARD_LANGUAGES],
      source,
    });
    appliedDefaults = true;
  }

  return { grants: result, appliedDefaults };
}
