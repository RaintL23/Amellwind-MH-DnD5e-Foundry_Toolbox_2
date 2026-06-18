import { getSpeciesById } from "@/features/species/services/species.service";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { getBackgroundById } from "@/features/backgrounds/services/background.service";
import { getDndBackgroundById } from "@/features/dnd-backgrounds/services/dnd-background.service";
import type { CharacterSelectionRef } from "@/shared/types";
import {
  isAmellwindBackgroundSelection,
  isAmellwindSpeciesSelection,
} from "./homebrew-cleanup.utils";
import { EMPTY_BACKGROUND_GRANTS, EMPTY_SPECIES_GRANTS } from "./grant-sync.constants";
import { resolveSpeciesDefenseGrants } from "./species-defense-grants.utils";
import { parseEntriesProficiencyGrants } from "@/shared/utils/text-proficiency-grants.parser";

import type { SpeciesTrait } from "@/shared/types";
import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";

function collectTraitTextProficiencyGrants(
  traits: SpeciesTrait[],
  sourceType: "species",
  sourceName: string,
): {
  armorGrants: NamedProficiencyGrant[];
  weaponGrants: NamedProficiencyGrant[];
  toolGrants: NamedProficiencyGrant[];
} {
  const armorGrants: NamedProficiencyGrant[] = [];
  const weaponGrants: NamedProficiencyGrant[] = [];
  const toolGrants: NamedProficiencyGrant[] = [];

  for (const trait of traits) {
    const source = { type: sourceType, name: `${sourceName} — ${trait.name}` };
    const parsed = parseEntriesProficiencyGrants(trait.entries, source);
    armorGrants.push(...parsed.armorGrants);
    weaponGrants.push(...parsed.weaponGrants);
    toolGrants.push(...parsed.toolGrants);
  }

  return { armorGrants, weaponGrants, toolGrants };
}

export async function loadSpeciesGrantPayload(
  species: CharacterSelectionRef & { subraceId?: string | null },
  speciesSpellGroupChoice: string | null,
  useAmellwindHomebrew: boolean,
) {
  const useAmellwind =
    useAmellwindHomebrew && (await isAmellwindSpeciesSelection(species));

  if (!useAmellwind) {
    const base = await getDndRaceById(species.id);
    if (!base) return { payload: EMPTY_SPECIES_GRANTS, invalidSubrace: false };

    const subrace = species.subraceId
      ? await getDndRaceById(species.subraceId)
      : undefined;

    if (species.subraceId && !subrace) {
      return { payload: EMPTY_SPECIES_GRANTS, invalidSubrace: true };
    }

    return {
      payload: {
        source: "species" as const,
        skillGrants: [
          ...base.skillGrants,
          ...(subrace?.skillGrants ?? []),
        ],
        skillAdvantages: [
          ...base.skillAdvantages,
          ...(subrace?.skillAdvantages ?? []),
        ],
        languageGrants: [
          ...base.languageGrants,
          ...(subrace?.languageGrants ?? []),
        ],
        defenseGrants: resolveSpeciesDefenseGrants(
          base,
          subrace ?? null,
          speciesSpellGroupChoice,
        ),
        ...collectTraitTextProficiencyGrants(
          [...base.traits, ...(subrace?.traits ?? [])],
          "species",
          subrace?.name ?? base.name,
        ),
      },
      invalidSubrace: false,
    };
  }

  const data = await getSpeciesById(species.id);
  if (!data) return { payload: EMPTY_SPECIES_GRANTS, invalidSubrace: false };

  return {
    payload: {
      source: "species" as const,
      skillGrants: data.skillGrants,
      skillAdvantages: data.skillAdvantages ?? [],
      languageGrants: data.languageGrants ?? [],
      defenseGrants: data.defenseGrants ?? [],
      ...collectTraitTextProficiencyGrants(data.traits ?? [], "species", data.name),
    },
    invalidSubrace: false,
  };
}

export async function loadBackgroundGrantPayload(
  background: CharacterSelectionRef,
  useAmellwindHomebrew: boolean,
) {
  const useAmellwind =
    useAmellwindHomebrew && (await isAmellwindBackgroundSelection(background));

  const data = useAmellwind
    ? await getBackgroundById(background.id)
    : await getDndBackgroundById(background.id);

  if (!data || !("skillGrants" in data)) {
    return EMPTY_BACKGROUND_GRANTS;
  }

  return {
    source: "background" as const,
    skillGrants: data.skillGrants,
    toolGrants: "toolGrants" in data ? data.toolGrants : [],
    languageGrants: "languageGrants" in data ? data.languageGrants : [],
  };
}
