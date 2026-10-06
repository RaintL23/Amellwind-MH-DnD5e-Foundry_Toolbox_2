/**
 * Display-level merge of a species (D&D race or Amellwind species) with its
 * selected subspecies. Shared by the compendium dialogs and the Builder library
 * so both surfaces show identical stats.
 */
import type { DamageType, Species } from "@/shared/types";
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
    speed: sub?.speed || species.speed,
    darkvision: sub?.darkvision ?? species.darkvision,
    resistances: [...new Set(both.flatMap((s) => s.resistances ?? []))],
    resistanceSummary: sub?.resistanceSummary || species.resistanceSummary,
    traitTags: [...new Set(both.flatMap((s) => s.traitTags ?? []))],
    baseAbilitySummary: meaningfulSummary(species.abilitySummary),
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
