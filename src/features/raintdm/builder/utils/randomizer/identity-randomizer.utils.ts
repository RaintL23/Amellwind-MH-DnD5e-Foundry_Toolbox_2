import {
  mergeSpeciesAbilityBonuses,
  mergeSpeciesTraits,
} from "@/shared/utils/species-display.utils";
import type {
  AbilityKey,
  Background,
  DndBackground,
  DndRace,
  Species,
} from "@/shared/types";
import type { AbilityBonus } from "@/shared/types/species.types";
import type { RpgbotRatingsData } from "@/features/raintdm/builder/data/rpgbot-ratings.types";
import {
  findRpgbotRating,
  toRpgbotClassSlug,
  type RpgbotLookupContext,
} from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import type {
  GoodEvilAxis,
  LawChaosAxis,
} from "@/features/raintdm/builder/utils/alignment.utils";
import { pickByRpgbot, pickRandom } from "./character-randomizer.utils";
import {
  excludeLastPick,
  getLastPick,
  rememberPick,
  type VarietyStorage,
} from "./randomizer-variety.utils";
import {
  loadDndNameTables,
  pickRandomDndName,
} from "@/shared/utils/dnd-name-randomizer.utils";

const LAW_CHAOS_AXES: LawChaosAxis[] = ["L", "N", "C"];
const GOOD_EVIL_AXES: GoodEvilAxis[] = ["G", "N", "E"];

export async function pickRandomCharacterName(
  speciesName?: string | null,
): Promise<string> {
  await loadDndNameTables();
  return pickRandomDndName({ speciesName });
}

export function pickRandomAlignmentAxes(): {
  lawChaos: LawChaosAxis;
  goodEvil: GoodEvilAxis;
} {
  return {
    lawChaos: pickRandom(LAW_CHAOS_AXES) ?? "N",
    goodEvil: pickRandom(GOOD_EVIL_AXES) ?? "N",
  };
}

const HUNTER_INITIATE_PATTERN = /hunter['']?s?\s+initiate/i;

function abilityBonusesIncludeAny(
  abilityBonuses: AbilityBonus[],
  abilities: AbilityKey[],
): boolean {
  if (abilities.length === 0) return true;
  const supported = new Set<AbilityKey>();
  for (const bonus of abilityBonuses) {
    if (bonus.kind === "fixed") {
      for (const key of Object.keys(bonus.bonuses) as AbilityKey[]) {
        if (bonus.bonuses[key]) supported.add(key);
      }
      continue;
    }
    for (const key of bonus.from) supported.add(key);
  }
  return abilities.some((ability) => supported.has(ability));
}

function getFixedAbilityBonus(
  abilityBonuses: AbilityBonus[],
  ability: AbilityKey,
): number {
  let total = 0;
  for (const bonus of abilityBonuses) {
    if (bonus.kind !== "fixed") continue;
    total += bonus.bonuses[ability] ?? 0;
  }
  return total;
}

function filterSpeciesByAbilityPriority(
  speciesList: Species[],
  abilityPriority: AbilityKey[],
): Species[] {
  if (speciesList.length === 0 || abilityPriority.length === 0) {
    return speciesList;
  }

  const [primary, secondary, tertiary] = abilityPriority;

  if (primary) {
    const strongPrimaryMatches = speciesList.filter(
      (species) => getFixedAbilityBonus(species.abilityBonuses, primary) >= 2,
    );
    if (strongPrimaryMatches.length > 0) return strongPrimaryMatches;

    const primaryMatches = speciesList.filter((species) =>
      abilityBonusesIncludeAny(species.abilityBonuses, [primary]),
    );
    if (primaryMatches.length > 0) return primaryMatches;
  }

  const secondaryTargets = [secondary, tertiary].filter(
    (ability): ability is AbilityKey => !!ability,
  );
  if (secondaryTargets.length > 0) {
    const secondaryMatches = speciesList.filter((species) =>
      abilityBonusesIncludeAny(species.abilityBonuses, secondaryTargets),
    );
    if (secondaryMatches.length > 0) return secondaryMatches;
  }

  return speciesList;
}

function filterBackgroundsByClassAbilities(
  backgrounds: DndBackground[],
  preferredAbilities: AbilityKey[],
): DndBackground[] {
  if (backgrounds.length === 0 || preferredAbilities.length === 0) {
    return backgrounds;
  }

  const [primary, secondary] = preferredAbilities;
  if (primary && secondary) {
    const bothMatches = backgrounds.filter(
      (background) =>
        abilityBonusesIncludeAny(background.abilityBonuses, [primary]) &&
        abilityBonusesIncludeAny(background.abilityBonuses, [secondary]),
    );
    if (bothMatches.length > 0) return bothMatches;
  }

  if (primary) {
    const primaryMatches = backgrounds.filter((background) =>
      abilityBonusesIncludeAny(background.abilityBonuses, [primary]),
    );
    if (primaryMatches.length > 0) return primaryMatches;
  }

  const topThreeMatches = backgrounds.filter((background) =>
    abilityBonusesIncludeAny(background.abilityBonuses, preferredAbilities.slice(0, 3)),
  );
  if (topThreeMatches.length > 0) return topThreeMatches;

  return backgrounds;
}

const SPECIES_VARIETY_CATEGORY = "species";
const BACKGROUND_VARIETY_CATEGORY = "background";

/** Expects races already limited to 2024+ sources; avoids the species picked last time. */
export function pickDndSpecies(
  races: DndRace[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  storage?: VarietyStorage | null,
): DndRace | null {
  const rootRaces = excludeLastPick(
    races.filter((race) => !race.parentName && race.kind !== "subrace"),
    (race) => race.id,
    getLastPick(SPECIES_VARIETY_CATEGORY, storage),
  );
  if (rootRaces.length === 0) return null;

  const classSlug = toRpgbotClassSlug(className);
  const picked =
    !classSlug || !rpgbotData
      ? pickRandom(rootRaces)
      : pickByRpgbot(rootRaces, (race) =>
          findRpgbotRating(
            rpgbotData.byClass,
            { classSlug, guideKey: "class", category: "species" },
            race.name,
            race.source,
            race.variantSources,
          ),
        );

  rememberPick(SPECIES_VARIETY_CATEGORY, picked?.id, storage);
  return picked;
}

export function pickAmellwindSpecies(
  speciesList: Species[],
  preferredAbilities: AbilityKey[],
  storage?: VarietyStorage | null,
): Species | null {
  const roots = speciesList.filter((species) => !species.isSubrace);
  if (roots.length === 0) return null;

  const matching = excludeLastPick(
    filterSpeciesByAbilityPriority(roots, preferredAbilities),
    (species) => species.name,
    getLastPick(SPECIES_VARIETY_CATEGORY, storage),
  );
  const picked = pickRandom(matching);
  rememberPick(SPECIES_VARIETY_CATEGORY, picked?.name, storage);
  return picked;
}

/** Random Amellwind subspecies for a root species (null when it has none). */
export function pickAmellwindSubspecies(
  speciesList: Species[],
  root: Species,
): Species | null {
  const name = root.name.toLowerCase();
  const subspecies = speciesList.filter(
    (species) =>
      species.isSubrace && species.parentSpecies?.toLowerCase() === name,
  );
  return pickRandom(subspecies) ?? null;
}

/** Root + subspecies grants as the Builder resolves them once both are selected. */
export function mergeAmellwindSpeciesForRandomizer(
  root: Species,
  subspecies: Species | null,
) {
  return {
    abilityBonuses: mergeSpeciesAbilityBonuses(root, subspecies),
    skillGrants: [...root.skillGrants, ...(subspecies?.skillGrants ?? [])],
    languageGrants: [
      ...(root.languageGrants ?? []),
      ...(subspecies?.languageGrants ?? []),
    ],
    weaponProficiencyGrants: [
      ...(root.weaponProficiencyGrants ?? []),
      ...(subspecies?.weaponProficiencyGrants ?? []),
    ],
    traits: mergeSpeciesTraits(root.traits, subspecies?.traits),
  };
}

/** Expects backgrounds already limited to 2024+ sources; avoids the background picked last time. */
export function pickDndBackground(
  backgrounds: DndBackground[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  preferredAbilities: AbilityKey[] = [],
  storage?: VarietyStorage | null,
): DndBackground | null {
  if (backgrounds.length === 0) return null;
  const compatible = excludeLastPick(
    filterBackgroundsByClassAbilities(backgrounds, preferredAbilities),
    (background) => background.id,
    getLastPick(BACKGROUND_VARIETY_CATEGORY, storage),
  );

  const classSlug = toRpgbotClassSlug(className);
  const context: RpgbotLookupContext | null = classSlug
    ? { classSlug, guideKey: "class", category: "background" }
    : null;
  const picked =
    !context || !rpgbotData
      ? pickRandom(compatible)
      : pickByRpgbot(compatible, (background) =>
          findRpgbotRating(
            rpgbotData.byClass,
            context,
            background.name,
            background.source,
            background.variantSources,
          ),
        );

  rememberPick(BACKGROUND_VARIETY_CATEGORY, picked?.id, storage);
  return picked;
}

export function pickAmellwindBackground(
  backgrounds: Background[],
): Background | null {
  if (backgrounds.length === 0) return null;
  const hunterInitiate = backgrounds.find((bg) =>
    HUNTER_INITIATE_PATTERN.test(bg.name),
  );
  return hunterInitiate ?? pickRandom(backgrounds);
}
