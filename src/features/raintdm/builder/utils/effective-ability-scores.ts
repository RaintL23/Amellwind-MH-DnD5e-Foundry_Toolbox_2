/**
 * Effective ability scores = base generation scores + origin bonuses (species /
 * Tasha / background ASI) + feat ASI picks. Used by AC, HP, initiative, combat,
 * spellcasting, and export — not just the ability-score UI.
 */
import type {
  AbilityBonus,
  AbilityKey,
  AbilityScores,
  BackgroundAsiMode,
  BuilderFeatSelection,
  BuilderMulticlassEntry,
  CharacterSelectionRef,
  Class,
  Species,
} from "@/shared/types";
import { ABILITY_KEYS } from "@/shared/constants/dnd";
import { getAbilityModifier } from "@/shared/utils/cr.utils";
import { applyFeatAsiBonuses } from "./feat-asi-bonuses";
import {
  applyBaseScores,
  buildAbilityBonusMap,
} from "./species-ability-bonuses";
import {
  buildClassLevelEntries,
  getPrimaryClassLevel,
} from "./multiclass.utils";

export interface EffectiveAbilityScoresInput {
  baseScores: AbilityScores;
  level: number;
  classSelection: CharacterSelectionRef | null;
  classData: Class | null;
  multiclassEnabled: boolean;
  multiclassEntries: BuilderMulticlassEntry[];
  multiclassClassData: (Class | null)[];
  species: Species | null;
  featSelections: (BuilderFeatSelection | null)[];
  useTashaOrigin: boolean;
  tashaPlus2: AbilityKey | null;
  tashaPlus1: AbilityKey | null;
  speciesAbilityChoices: (AbilityKey | null)[];
  background: {
    name: string;
    abilityBonuses: AbilityBonus[];
  } | null;
  backgroundAsiMode: BackgroundAsiMode | null;
  backgroundAsiPlus2: AbilityKey | null;
  backgroundAsiPlus1: AbilityKey | null;
}

export function computeEffectiveAbilityScores(
  input: EffectiveAbilityScoresInput,
): AbilityScores {
  const primaryLevel = input.multiclassEnabled
    ? getPrimaryClassLevel(input.level, input.multiclassEntries)
    : input.level;

  const classEntries = buildClassLevelEntries(
    input.classSelection,
    input.classData,
    primaryLevel,
    null,
    input.multiclassEntries,
    input.multiclassClassData,
  );

  const bonusMap = buildAbilityBonusMap(input.species, {
    useTashaOrigin: input.useTashaOrigin,
    tashaPlus2: input.tashaPlus2,
    tashaPlus1: input.tashaPlus1,
    speciesChoices: input.speciesAbilityChoices,
    background: input.background,
    backgroundAsiMode: input.backgroundAsiMode,
    backgroundAsiPlus2: input.backgroundAsiPlus2,
    backgroundAsiPlus1: input.backgroundAsiPlus1,
  });

  const classNames = classEntries
    .filter((e) => e.classData)
    .map((e) => e.classData!.name)
    .join("/");

  applyFeatAsiBonuses(
    bonusMap,
    input.featSelections,
    classNames || input.classSelection?.name || "",
    input.level,
  );

  const totals = applyBaseScores(bonusMap, input.baseScores);
  return ABILITY_KEYS.reduce((acc, key) => {
    acc[key] = input.baseScores[key] + totals[key].bonus;
    return acc;
  }, {} as AbilityScores);
}

export function abilityModifiersFromScores(
  scores: AbilityScores,
): Record<AbilityKey, number> {
  return ABILITY_KEYS.reduce(
    (acc, key) => {
      acc[key] = getAbilityModifier(scores[key]);
      return acc;
    },
    {} as Record<AbilityKey, number>,
  );
}
