import type { Species, SpeciesTrait } from "@/shared/types";

/** Trait-name key → chosen option id (or option name for older snapshots). */
export type SpeciesTraitChoices = Record<string, string>;

export function speciesTraitChoiceKey(traitName: string): string {
  return traitName.trim().toLowerCase();
}

export function formatSpeciesTraitChoiceOption(
  name: string,
  entries: string[],
): string[] {
  if (entries.length === 1) return [`• ${name}: ${entries[0]}`];
  return [`• ${name}`, ...entries];
}

/**
 * Resolves display paragraphs for a species trait, optionally filtering to the
 * Builder-chosen creation option (hides unselected ancestry / lineage text).
 */
export function resolveSpeciesTraitEntries(
  trait: SpeciesTrait,
  selectedOptionId: string | null | undefined,
  options?: { showAllWhenUnselected?: boolean },
): string[] {
  const choice = trait.creationChoice;
  const intro = trait.entries ?? [];
  if (!choice) return intro;

  const showAll = options?.showAllWhenUnselected !== false;
  if (!selectedOptionId) {
    if (!showAll) return intro;
    return [
      ...intro,
      ...choice.options.flatMap((option) =>
        formatSpeciesTraitChoiceOption(option.name, option.entries),
      ),
    ];
  }

  const selected =
    choice.options.find(
      (option) =>
        option.id === selectedOptionId ||
        option.name.toLowerCase() === selectedOptionId.toLowerCase(),
    ) ?? null;
  if (!selected) return intro;
  return [
    ...intro,
    ...formatSpeciesTraitChoiceOption(selected.name, selected.entries),
  ];
}

export function collectSpeciesTraitsWithCreationChoice(
  traits: SpeciesTrait[] | null | undefined,
): SpeciesTrait[] {
  return (traits ?? []).filter((trait) => Boolean(trait.creationChoice));
}

export function isSpeciesTraitChoiceRequired(
  trait: SpeciesTrait,
  characterLevel: number,
): boolean {
  const choice = trait.creationChoice;
  if (!choice?.options.length) return false;
  const minLevel = choice.minLevel ?? 1;
  return characterLevel >= minLevel;
}

export function findSpeciesTraitChoiceGaps(
  traits: SpeciesTrait[] | null | undefined,
  choices: SpeciesTraitChoices,
  characterLevel: number,
): SpeciesTrait[] {
  return collectSpeciesTraitsWithCreationChoice(traits).filter((trait) => {
    if (!isSpeciesTraitChoiceRequired(trait, characterLevel)) return false;
    const key = speciesTraitChoiceKey(trait.name);
    const picked = choices[key];
    if (!picked) return true;
    const options = trait.creationChoice?.options ?? [];
    return !options.some(
      (option) =>
        option.id === picked ||
        option.name.toLowerCase() === picked.toLowerCase(),
    );
  });
}

export function resolveTraitChoiceSelection(
  trait: SpeciesTrait,
  choices: SpeciesTraitChoices,
): string | null {
  if (!trait.creationChoice) return null;
  return choices[speciesTraitChoiceKey(trait.name)] ?? null;
}

/** Traits from base + optional subrace for creation-choice completeness. */
export function speciesTraitsForCreationChoices(
  speciesData: Species | null,
  subraceTraits?: SpeciesTrait[] | null,
): SpeciesTrait[] {
  const byName = new Map<string, SpeciesTrait>();
  for (const trait of [
    ...(speciesData?.traits ?? []),
    ...(subraceTraits ?? []),
  ]) {
    const key = speciesTraitChoiceKey(trait.name);
    if (!key || byName.has(key)) continue;
    byName.set(key, trait);
  }
  return [...byName.values()];
}
