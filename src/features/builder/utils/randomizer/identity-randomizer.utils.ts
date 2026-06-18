import type {
  AbilityKey,
  Background,
  DndBackground,
  DndRace,
  Species,
} from "@/shared/types";
import type { AbilityBonus } from "@/shared/types/species.types";
import type { RpgbotRatingsData } from "@/features/builder/data/rpgbot-ratings.types";
import {
  findRpgbotRating,
  toRpgbotClassSlug,
  type RpgbotLookupContext,
} from "@/features/builder/data/rpgbot-ratings.utils";
import type {
  GoodEvilAxis,
  LawChaosAxis,
} from "@/features/builder/utils/alignment.utils";
import { pickByRpgbot, pickRandom, prefer2024Edition } from "./character-randomizer.utils";
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

function speciesMatchesSaveProficiencies(
  abilityBonuses: AbilityBonus[],
  saveProficiencies: AbilityKey[],
): boolean {
  if (saveProficiencies.length === 0) return true;

  const boosted = new Set<AbilityKey>();
  for (const bonus of abilityBonuses) {
    if (bonus.kind === "fixed") {
      for (const key of Object.keys(bonus.bonuses) as AbilityKey[]) {
        if (bonus.bonuses[key]) boosted.add(key);
      }
    } else if (bonus.kind === "choose") {
      for (const key of bonus.from) boosted.add(key);
    } else if (bonus.kind === "weightedDistribution") {
      for (const key of bonus.from) boosted.add(key);
    }
  }

  return saveProficiencies.some((ability) => boosted.has(ability));
}

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

function filterBackgroundsByClassAbilities(
  backgrounds: DndBackground[],
  preferredAbilities: AbilityKey[],
): DndBackground[] {
  if (backgrounds.length === 0 || preferredAbilities.length === 0) {
    return backgrounds;
  }

  const [primary] = preferredAbilities;
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

export function pickDndSpecies(
  races: DndRace[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
): DndRace | null {
  const rootRaces = prefer2024Edition(
    races.filter((race) => !race.parentName && race.kind !== "subrace"),
  );
  if (rootRaces.length === 0) return null;

  const classSlug = toRpgbotClassSlug(className);
  if (!classSlug || !rpgbotData) {
    return pickRandom(rootRaces);
  }

  const context: RpgbotLookupContext = {
    classSlug,
    guideKey: "class",
    category: "species",
  };

  return pickByRpgbot(rootRaces, (race) =>
    findRpgbotRating(
      rpgbotData.byClass,
      context,
      race.name,
      race.source,
      race.variantSources,
    ),
  );
}

export function pickAmellwindSpecies(
  speciesList: Species[],
  preferredAbilities: AbilityKey[],
): Species | null {
  const roots = speciesList.filter((species) => !species.isSubrace);
  if (roots.length === 0) return null;

  const relevant = preferredAbilities.slice(0, 3);
  const matching = roots.filter((species) =>
    speciesMatchesSaveProficiencies(species.abilityBonuses, relevant),
  );

  return pickRandom(matching.length > 0 ? matching : roots);
}

export function pickDndBackground(
  backgrounds: DndBackground[],
  rpgbotData: RpgbotRatingsData | null,
  className: string,
  preferredAbilities: AbilityKey[] = [],
): DndBackground | null {
  const preferred = prefer2024Edition(backgrounds);
  if (preferred.length === 0) return null;
  const compatible = filterBackgroundsByClassAbilities(
    preferred,
    preferredAbilities,
  );

  const classSlug = toRpgbotClassSlug(className);
  if (!classSlug || !rpgbotData) {
    return pickRandom(compatible);
  }

  const context: RpgbotLookupContext = {
    classSlug,
    guideKey: "class",
    category: "background",
  };

  return pickByRpgbot(compatible, (background) =>
    findRpgbotRating(
      rpgbotData.byClass,
      context,
      background.name,
      background.source,
      background.variantSources,
    ),
  );
}

export function pickAmellwindBackground(
  backgrounds: Background[],
): Background | null {
  const hunterInitiate = backgrounds.find((bg) =>
    HUNTER_INITIATE_PATTERN.test(bg.name),
  );
  return hunterInitiate ?? null;
}
