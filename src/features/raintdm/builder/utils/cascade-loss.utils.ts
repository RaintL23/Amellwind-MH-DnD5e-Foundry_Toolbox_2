import type { CharacterBuilderContextValue } from "../context/character-builder.types";

/** Identity picks whose setters reset dependent choices (see useIdentitySlice). */
export type CascadeChange = "class" | "species" | "background";

export type CascadeLossState = Pick<
  CharacterBuilderContextValue,
  | "subclass"
  | "featSelections"
  | "spellSelections"
  | "optionalFeatureSelections"
  | "classSkillChoices"
  | "expertiseChoices"
  | "classToolChoices"
  | "classWeaponChoices"
  | "classLanguageChoices"
  | "speciesAbilityChoices"
  | "speciesOriginFeat"
  | "speciesTraitChoices"
  | "speciesSkillChoices"
  | "speciesToolChoices"
  | "speciesWeaponChoices"
  | "speciesLanguageChoices"
  | "speciesDefenseChoices"
  | "backgroundAsiMode"
  | "backgroundOriginFeat"
  | "backgroundSkillChoices"
  | "backgroundToolChoices"
  | "backgroundLanguageChoices"
>;

function countPicks(
  record: Readonly<Record<string | number, readonly unknown[] | undefined>> | undefined,
): number {
  return Object.values(record ?? {}).reduce<number>(
    (total, picks) => total + (picks?.length ?? 0),
    0,
  );
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Human-readable list of the choices a class/species/background change clears.
 * Empty when nothing the player picked would be lost.
 */
export function describeCascadeLoss(
  state: CascadeLossState,
  change: CascadeChange,
  options: {
    /** Re-picking the same species (e.g. a new subrace) keeps the origin feat. */
    sameSpecies?: boolean;
  } = {},
): string[] {
  const lost: string[] = [];

  if (change === "class") {
    if (state.subclass) lost.push(`Subclass: ${state.subclass.name}`);
    const feats = state.featSelections.filter(Boolean).length;
    if (feats > 0) lost.push(plural(feats, "feat"));
    const spells = countPicks(state.spellSelections);
    if (spells > 0) lost.push(plural(spells, "spell"));
    const options = countPicks(state.optionalFeatureSelections);
    if (options > 0) lost.push(plural(options, "class option"));
    const picks =
      countPicks(state.classSkillChoices) +
      countPicks(state.expertiseChoices) +
      countPicks(state.classToolChoices) +
      countPicks(state.classWeaponChoices) +
      countPicks(state.classLanguageChoices);
    if (picks > 0) lost.push(plural(picks, "class proficiency pick"));
    return lost;
  }

  if (change === "species") {
    if (state.speciesAbilityChoices.some(Boolean)) {
      lost.push("Species ability bonuses");
    }
    if (state.speciesOriginFeat && !options.sameSpecies) {
      lost.push(`Origin feat: ${state.speciesOriginFeat.name}`);
    }
    const traits = Object.keys(state.speciesTraitChoices ?? {}).length;
    if (traits > 0) lost.push(plural(traits, "species trait choice"));
    const picks =
      state.speciesSkillChoices.length +
      state.speciesToolChoices.length +
      state.speciesWeaponChoices.length +
      state.speciesLanguageChoices.length +
      countPicks(state.speciesDefenseChoices);
    if (picks > 0) lost.push(plural(picks, "species proficiency pick"));
    return lost;
  }

  if (state.backgroundAsiMode) lost.push("Background ability bonuses");
  if (state.backgroundOriginFeat) {
    lost.push(`Origin feat: ${state.backgroundOriginFeat.name}`);
  }
  const picks =
    state.backgroundSkillChoices.length +
    state.backgroundToolChoices.length +
    state.backgroundLanguageChoices.length;
  if (picks > 0) lost.push(plural(picks, "background proficiency pick"));
  return lost;
}
