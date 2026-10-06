import { ScrollText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import type { NamedVariant } from "@/shared/components/NamedVariantSwitcher";
import { SourceVariantSwitcher } from "@/shared/components/SourceVariantSwitcher";
import type { SourceVariant } from "@/shared/types";
import {
  SPECIES_CATEGORY_LABELS,
  type SpeciesCategory,
  type StartingEquipmentSource,
} from "@/shared/types";
import { BackgroundContent } from "@/shared/components/background/BackgroundContent";
import { SpeciesContent } from "@/shared/components/species/SpeciesContent";
import {
  getBackgroundMetaLabels,
  type BackgroundDetailData,
} from "@/shared/utils/background-display.utils";
import {
  resolveSpeciesDisplayStats,
  type SpeciesContentData,
} from "@/shared/utils/species-display.utils";
import { hasStartingEquipmentOffers } from "@/shared/utils/starting-equipment.parser";
import { StartingEquipmentPicker } from "../StartingEquipmentPicker";
import { LibraryDetailAccordion } from "./shared/LibraryDetailAccordion";

interface IdentityLibraryDetailProps {
  /** D&D race or Amellwind species (Amellwind adds `category`). */
  species?: SpeciesContentData & { category?: SpeciesCategory };
  /** D&D or Amellwind background. */
  background?: BackgroundDetailData;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  subspeciesOptions?: NamedVariant[];
  activeSubspeciesId?: string | null;
  onSubspeciesSelect?: (id: string | null) => void;
  /** Selected subspecies / subrace (D&D or Amellwind). */
  subspecies?: SpeciesContentData | null;
  subspeciesLabel?: string | null;
  bookNames?: BookSourceNameMap;
  /** When set, D&D starting equipment offers become an inventory picker. */
  startingEquipmentSource?: StartingEquipmentSource;
  /** Currently selected legacy group name. */
  activeLegacyId?: string | null;
  /** Called when the user selects (or deselects) a legacy. */
  onLegacySelect?: (name: string | null) => void;
  /** Permanent trait option picks (Goliath Ancestry, Gnome Lineage, …). */
  speciesTraitChoices?: Record<string, string>;
  /** Called when the user picks an option inside a creation-choice trait. */
  onSpeciesTraitChoiceSelect?: (
    traitName: string,
    optionId: string | null,
  ) => void;
  /** Rendered inside a library row: omit the titled accordion shell. */
  inline?: boolean;
}


export function IdentityLibraryDetail({
  species,
  background,
  sourceVariants,
  activeSourceId,
  onSourceSelect,
  subspeciesOptions,
  activeSubspeciesId = null,
  onSubspeciesSelect,
  subspecies = null,
  subspeciesLabel,
  bookNames = {},
  startingEquipmentSource,
  activeLegacyId = null,
  onLegacySelect,
  speciesTraitChoices,
  onSpeciesTraitChoiceSelect,
  inline = false,
}: IdentityLibraryDetailProps) {
  const isSpecies = !!species;
  const name = species?.name ?? background?.name ?? "";
  const accentClass = isSpecies ? "text-emerald-400" : "text-sky-400";
  const Icon = isSpecies ? Users : ScrollText;
  const displayName =
    isSpecies && subspeciesLabel ? `${name} (${subspeciesLabel})` : name;
  const speciesStats = species
    ? resolveSpeciesDisplayStats(species, subspecies)
    : null;

  return (
    <LibraryDetailAccordion
      value="identity-details"
      icon={Icon}
      title={displayName}
      accentClass={accentClass}
      inline={inline}
    >
      {sourceVariants && onSourceSelect && (
        <SourceVariantSwitcher
          variants={sourceVariants}
          activeId={activeSourceId}
          onSelect={onSourceSelect}
          bookNames={bookNames}
          accent="emerald"
          className="mb-2"
        />
      )}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {species && speciesStats && (
          <>
            {species.category && SPECIES_CATEGORY_LABELS[species.category] && (
              <Badge variant="secondary" className="text-[10px]">
                {SPECIES_CATEGORY_LABELS[species.category]}
              </Badge>
            )}
            {subspeciesLabel && (
              <Badge
                variant="outline"
                className="border-sky-500/40 text-[10px] text-sky-300"
              >
                {subspeciesLabel}
              </Badge>
            )}
            {speciesStats.sizes.length ? (
              <Badge variant="outline" className="text-[10px]">
                {speciesStats.sizes.join(", ")}
              </Badge>
            ) : null}
            {speciesStats.speed ? (
              <Badge variant="outline" className="text-[10px]">
                {speciesStats.speed}
              </Badge>
            ) : null}
          </>
        )}
        {background &&
          getBackgroundMetaLabels(background).map((label, i) => (
            <Badge
              key={label}
              variant={i === 0 ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {label}
            </Badge>
          ))}
        <span className="text-[10px] text-muted-foreground">
          {species?.source ?? background?.source}
          {(species?.page ?? background?.page) !== undefined
            ? ` p.${species?.page ?? background?.page}`
            : ""}
        </span>
      </div>

      {species && (
        <SpeciesContent
          species={species}
          subspecies={subspecies}
          subspeciesOptions={subspeciesOptions}
          activeSubspeciesId={activeSubspeciesId}
          onSubspeciesSelect={onSubspeciesSelect}
          activeLegacyId={activeLegacyId}
          onLegacySelect={onLegacySelect}
          traitChoices={speciesTraitChoices}
          onTraitChoiceSelect={onSpeciesTraitChoiceSelect}
          density="compact"
        />
      )}
      {background && (
        <BackgroundContent
          background={background}
          density="compact"
          accent="sky"
          equipmentSlot={
            background.startingEquipmentOffers &&
            startingEquipmentSource &&
            hasStartingEquipmentOffers(background.startingEquipmentOffers) ? (
              <div className="mb-3">
                <StartingEquipmentPicker
                  offers={background.startingEquipmentOffers}
                  source={startingEquipmentSource}
                />
              </div>
            ) : null
          }
        />
      )}
    </LibraryDetailAccordion>
  );
}
