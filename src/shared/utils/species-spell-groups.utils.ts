import type { SpeciesNamedSpellGroup } from "@/shared/types/dnd-race.types";

/** Lineage / innate spell data carried by a species (D&D or Amellwind) or subrace. */
export interface SpeciesSpellGrantSource {
  universalCantrips?: string[];
  namedSpellGroups?: SpeciesNamedSpellGroup[];
}

/** Base species + optional subrace: subrace groups replace base groups; cantrips stack. */
export function combineSpeciesSpellGrantSource(
  base: SpeciesSpellGrantSource | null | undefined,
  subrace: SpeciesSpellGrantSource | null | undefined,
): SpeciesSpellGrantSource | null {
  if (!base && !subrace) return null;
  const root = base ?? subrace!;
  const variant = subrace ?? null;
  const groups =
    variant?.namedSpellGroups && variant.namedSpellGroups.length > 0
      ? variant.namedSpellGroups
      : root.namedSpellGroups;

  return {
    universalCantrips: [
      ...(root.universalCantrips ?? []),
      ...(variant?.universalCantrips ?? []),
    ],
    namedSpellGroups: groups,
  };
}

/** A single group applies automatically; multiple groups need an explicit choice. */
export function resolveActiveSpellGroup(
  source: SpeciesSpellGrantSource,
  choice: string | null,
): SpeciesNamedSpellGroup | null {
  if (!source.namedSpellGroups?.length) return null;
  if (source.namedSpellGroups.length === 1) {
    return source.namedSpellGroups[0] ?? null;
  }
  if (!choice) return null;
  return (
    source.namedSpellGroups.find(
      (group) => group.name.toLowerCase() === choice.toLowerCase(),
    ) ?? null
  );
}
