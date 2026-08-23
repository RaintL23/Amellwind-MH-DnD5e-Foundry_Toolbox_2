import { getBackgroundById } from "@/features/amellwind/backgrounds/services/background.service";
import { getDndBackgroundById } from "@/features/dnd/backgrounds/services/dnd-background.service";
import type { CharacterSelectionRef } from "@/shared/types";
import type { DndRace, Species } from "@/shared/types";
import {
  isAmellwindBackgroundSelection,
  isAmellwindSpeciesSelection,
} from "./homebrew-cleanup.utils";
import { EMPTY_BACKGROUND_GRANTS, EMPTY_SPECIES_GRANTS } from "./grant-sync.constants";
import { resolveSpeciesDefenseGrants } from "./species-defense-grants.utils";
import { resolveSpeciesParts } from "./species-resolution.utils";
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

function mergeNamedGrants(
  ...groups: Array<NamedProficiencyGrant[] | undefined>
): NamedProficiencyGrant[] {
  return groups.flatMap((group) => group ?? []);
}

function structuredWeaponGrants(
  entry: Species | DndRace,
): NamedProficiencyGrant[] {
  return entry.weaponProficiencyGrants ?? [];
}

function structuredToolGrants(entry: Species | DndRace): NamedProficiencyGrant[] {
  return entry.toolProficiencyGrants ?? [];
}

function buildSpeciesGrantPayloadFromParts(
  base: Species | DndRace,
  subrace: Species | DndRace | null | undefined,
  speciesSpellGroupChoice: string | null,
) {
  const sub = subrace ?? null;
  const traitSourceName = sub?.name ?? base.name;
  const traitGrants = collectTraitTextProficiencyGrants(
    [...base.traits, ...(sub?.traits ?? [])],
    "species",
    traitSourceName,
  );

  return {
    source: "species" as const,
    skillGrants: [...base.skillGrants, ...(sub?.skillGrants ?? [])],
    skillAdvantages: [
      ...base.skillAdvantages,
      ...(sub?.skillAdvantages ?? []),
    ],
    languageGrants: [
      ...base.languageGrants,
      ...(sub?.languageGrants ?? []),
    ],
    defenseGrants: resolveSpeciesDefenseGrants(
      base as DndRace,
      (sub as DndRace | null) ?? null,
      speciesSpellGroupChoice,
    ),
    weaponGrants: mergeNamedGrants(
      structuredWeaponGrants(base),
      sub ? structuredWeaponGrants(sub) : undefined,
      traitGrants.weaponGrants,
    ),
    toolGrants: mergeNamedGrants(
      structuredToolGrants(base),
      sub ? structuredToolGrants(sub) : undefined,
      traitGrants.toolGrants,
    ),
    armorGrants: traitGrants.armorGrants,
  };
}

export async function loadSpeciesGrantPayload(
  species: CharacterSelectionRef & { subraceId?: string | null },
  speciesSpellGroupChoice: string | null,
  useAmellwindHomebrew: boolean,
) {
  const useAmellwind =
    useAmellwindHomebrew && (await isAmellwindSpeciesSelection(species));

  const parts = await resolveSpeciesParts(species);

  if (useAmellwind && parts.mhSpecies) {
    if (species.subraceId && !parts.mhSubrace) {
      return { payload: EMPTY_SPECIES_GRANTS, invalidSubrace: true };
    }

    return {
      payload: buildSpeciesGrantPayloadFromParts(
        parts.mhSpecies,
        parts.mhSubrace,
        speciesSpellGroupChoice,
      ),
      invalidSubrace: false,
    };
  }

  if (parts.dndRace) {
    if (species.subraceId && !parts.dndSubrace) {
      return { payload: EMPTY_SPECIES_GRANTS, invalidSubrace: true };
    }

    return {
      payload: buildSpeciesGrantPayloadFromParts(
        parts.dndRace,
        parts.dndSubrace,
        speciesSpellGroupChoice,
      ),
      invalidSubrace: false,
    };
  }

  return { payload: EMPTY_SPECIES_GRANTS, invalidSubrace: false };
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
