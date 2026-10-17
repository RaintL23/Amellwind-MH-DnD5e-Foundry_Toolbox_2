/**
 * Display-level merge of a species (D&D race or Amellwind species) with its
 * selected subspecies. Shared by the compendium dialogs and the Builder library
 * so both surfaces show identical stats.
 */
import type {
  AbilityBonus,
  DamageType,
  Species,
  SpeciesTrait,
} from "@/shared/types";
import {
  buildNamedGrantSummaryRows,
  buildSkillGrantSummaryRows,
  type LibraryProficiencySummaryRow,
} from "@/shared/utils/library-proficiency-highlight.utils";

/** Fields shared by `Species` and `DndRace` that the species views render. */
export type SpeciesContentData = Pick<
  Species,
  | "name"
  | "source"
  | "page"
  | "sizes"
  | "speed"
  | "abilitySummary"
  | "overwritesAbility"
  | "darkvision"
  | "resistances"
  | "resistanceSummary"
  | "traitTags"
  | "traits"
  | "fluff"
  | "skillGrants"
  | "languageGrants"
  | "weaponProficiencyGrants"
  | "toolProficiencyGrants"
  | "namedSpellGroups"
  | "universalCantrips"
> & {
  /** Trait label for the lineage picker (e.g. "Fiendish Legacy"). */
  namedSpellGroupsLabel?: string;
};

export interface SpeciesDisplayStats {
  sizes: string[];
  speed: string;
  darkvision?: number;
  resistances: DamageType[];
  resistanceSummary: string;
  traitTags: string[];
  baseAbilitySummary: string | null;
  subspeciesAbilitySummary: string | null;
  proficiencyRows: LibraryProficiencySummaryRow[];
}

/** Base traits minus those a subspecies replaces via `data.overwrite`. */
export function filterOverwrittenTraits(
  baseTraits: SpeciesTrait[],
  subspeciesTraits: SpeciesTrait[] = [],
): SpeciesTrait[] {
  const replaced = new Set(
    subspeciesTraits
      .map((trait) => trait.overwrites?.trim().toLowerCase())
      .filter((name): name is string => !!name),
  );
  if (replaced.size === 0) return baseTraits;
  return baseTraits.filter(
    (trait) => !replaced.has(trait.name.trim().toLowerCase()),
  );
}

/** True when a subspecies trait replaces a base resistance trait (e.g. Elder Dragonborn). */
export function subspeciesReplacesResistance(
  subspeciesTraits: SpeciesTrait[] = [],
): boolean {
  return subspeciesTraits.some((trait) =>
    /resist/i.test(trait.overwrites ?? ""),
  );
}

/** Base + subspecies traits, without the base traits the subspecies replaces. */
export function mergeSpeciesTraits(
  baseTraits: SpeciesTrait[],
  subspeciesTraits: SpeciesTrait[] = [],
): SpeciesTrait[] {
  return [
    ...filterOverwrittenTraits(baseTraits, subspeciesTraits),
    ...subspeciesTraits,
  ];
}

/** Base + subspecies ASI; an `overwrite.ability` subspecies replaces the base ASI. */
export function mergeSpeciesAbilityBonuses(
  base: Pick<Species, "abilityBonuses">,
  subspecies?: Pick<Species, "abilityBonuses" | "overwritesAbility"> | null,
): AbilityBonus[] {
  if (!subspecies) return base.abilityBonuses;
  if (subspecies.overwritesAbility) return subspecies.abilityBonuses;
  return [...base.abilityBonuses, ...subspecies.abilityBonuses];
}

/** Speed text, treating placeholders like "Varies" as "defined by the subspecies". */
function hasConcreteSpeed(speed: string | undefined | null): speed is string {
  return !!speed && /\d/.test(speed);
}

export function mergeSpeciesSpeed(
  baseSpeed: string,
  subspeciesSpeed?: string | null,
): string {
  if (hasConcreteSpeed(subspeciesSpeed)) return subspeciesSpeed;
  return baseSpeed;
}

function meaningfulSummary(summary: string | undefined | null): string | null {
  return summary && summary !== "—" ? summary : null;
}

export function resolveSpeciesDisplayStats(
  species: SpeciesContentData,
  subspecies?: SpeciesContentData | null,
): SpeciesDisplayStats {
  const sub = subspecies ?? null;
  const both = sub ? [species, sub] : [species];

  return {
    sizes: sub?.sizes.length ? sub.sizes : species.sizes,
    speed: mergeSpeciesSpeed(species.speed, sub?.speed),
    darkvision: sub?.darkvision ?? species.darkvision,
    resistances: [...new Set(both.flatMap((s) => s.resistances ?? []))],
    resistanceSummary: sub?.resistanceSummary || species.resistanceSummary,
    traitTags: [...new Set(both.flatMap((s) => s.traitTags ?? []))],
    baseAbilitySummary: sub?.overwritesAbility
      ? null
      : meaningfulSummary(species.abilitySummary),
    subspeciesAbilitySummary: meaningfulSummary(sub?.abilitySummary),
    proficiencyRows: [
      ...buildSkillGrantSummaryRows(both.flatMap((s) => s.skillGrants ?? [])),
      ...buildNamedGrantSummaryRows(
        "Weapons",
        both.flatMap((s) => s.weaponProficiencyGrants ?? []),
      ),
      ...buildNamedGrantSummaryRows(
        "Tools",
        both.flatMap((s) => s.toolProficiencyGrants ?? []),
      ),
      ...buildNamedGrantSummaryRows(
        "Languages",
        both.flatMap((s) => s.languageGrants ?? []),
      ),
    ],
  };
}
