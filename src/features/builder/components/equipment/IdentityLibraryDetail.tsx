import { ScrollText, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BookSourceNameMap } from "@/features/spells/services/book-source.service";
import {
  NamedVariantSwitcher,
  type NamedVariant,
} from "@/features/builder/components/shared/NamedVariantSwitcher";
import { SourceVariantSwitcher } from "@/features/builder/components/shared/SourceVariantSwitcher";
import type { SourceVariant } from "@/features/builder/utils/library-variant.utils";
import { cn } from "@/shared/utils/cn";
import {
  BACKGROUND_FACTION_LABELS,
  SPECIES_CATEGORY_LABELS,
  type Background,
  type BackgroundSection,
  type Species,
  type SpeciesTable,
  type SpeciesTrait,
} from "@/shared/types";
import { DndRichText } from "@/shared/components/DndRichText";
import type {
  StartingEquipmentOffers,
  StartingEquipmentSource,
} from "@/shared/types";
import { hasStartingEquipmentOffers } from "@/shared/utils/starting-equipment.parser";
import { StartingEquipmentPicker } from "./StartingEquipmentPicker";

interface IdentityLibraryDetailProps {
  species?: Species;
  background?: Background;
  /** D&D 2024 background ASI summary (shown below proficiencies). */
  backgroundAbilitySummary?: string | null;
  /** D&D 2024 background origin feat summary. */
  backgroundFeatSummary?: string | null;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  subspeciesOptions?: NamedVariant[];
  activeSubspeciesId?: string | null;
  onSubspeciesSelect?: (id: string | null) => void;
  subspeciesTraits?: SpeciesTrait[];
  subspeciesLabel?: string | null;
  subspeciesAbilitySummary?: string | null;
  bookNames?: BookSourceNameMap;
  startingEquipmentOffers?: StartingEquipmentOffers;
  startingEquipmentSource?: StartingEquipmentSource;
}

function DetailTable({ caption, colLabels, rows }: SpeciesTable) {
  return (
    <div className="my-2 overflow-x-auto rounded-md border border-border">
      {caption && (
        <p className="border-b border-border bg-muted/30 px-2 py-1.5 text-[10px] font-semibold text-amber-400/90">
          {caption}
        </p>
      )}
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {colLabels.map((label) => (
              <th
                key={label}
                className="px-2 py-1.5 text-left font-semibold text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1.5 text-foreground/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TraitList({
  traits,
  heading,
  headingClass,
  traitNameClass,
  bodyClass,
  containerClass,
}: {
  traits: SpeciesTrait[];
  heading: string;
  headingClass: string;
  traitNameClass: string;
  bodyClass?: string;
  containerClass?: string;
}) {
  if (!traits.length) return null;

  return (
    <>
      <Separator className="my-3" />
      <h3
        className={cn(
          "mb-2 text-[10px] font-bold uppercase tracking-wider",
          headingClass,
        )}
      >
        {heading}
      </h3>
      <div className={cn("space-y-3", containerClass)}>
        {traits.map((trait) => (
          <div
            key={trait.name}
            className={cn(
              containerClass &&
                "rounded-md border border-sky-500/20 bg-sky-500/5 px-2 py-1.5",
            )}
          >
            <h4 className={cn("mb-0.5 text-xs font-semibold", traitNameClass)}>
              {trait.name}
            </h4>
            {(trait.entries ?? []).map((paragraph, i) => (
              <p
                key={i}
                className={cn(
                  "mb-1 text-xs leading-relaxed text-muted-foreground",
                  bodyClass,
                )}
              >
                <DndRichText text={paragraph} />
              </p>
            ))}
            {trait.tables?.map((table, i) => (
              <DetailTable key={i} {...table} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function BackgroundSectionBlock({
  sections,
  heading,
  accentClass,
}: {
  sections?: BackgroundSection[];
  heading: string;
  accentClass: string;
}) {
  if (!sections?.length) return null;

  return (
    <>
      <h3
        className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${accentClass}`}
      >
        {heading}
      </h3>
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.name}>
            <h4 className="mb-0.5 text-xs font-semibold text-foreground">
              {section.name}
            </h4>
            {section.entries?.map((paragraph, i) => (
              <p
                key={i}
                className="mb-1 text-xs leading-relaxed text-muted-foreground"
              >
                <DndRichText text={paragraph} />
              </p>
            ))}
            {section.tables?.map((table, i) => (
              <DetailTable key={i} {...table} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function SpeciesBonuses({
  baseSummary,
  subspeciesSummary,
}: {
  baseSummary?: string;
  subspeciesSummary?: string | null;
}) {
  const base = baseSummary && baseSummary !== "—" ? baseSummary : null;
  const sub =
    subspeciesSummary && subspeciesSummary !== "—" ? subspeciesSummary : null;

  if (!base && !sub) return null;

  return (
    <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5">
      <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        Bonuses
      </p>
      <p className="font-medium">
        {base && <span className="text-foreground">{base}</span>}
        {base && sub && <span className="text-muted-foreground"> · </span>}
        {sub && <span className="text-sky-300">{sub}</span>}
      </p>
    </div>
  );
}

function SpeciesDetailBody({
  species,
  subspeciesTraits = [],
  subspeciesLabel,
  subspeciesAbilitySummary,
}: {
  species: Species;
  subspeciesTraits?: SpeciesTrait[];
  subspeciesLabel?: string | null;
  subspeciesAbilitySummary?: string | null;
}) {
  const resistances = species.resistances ?? [];
  const traitTags = species.traitTags ?? [];
  const traits = species.traits ?? [];

  return (
    <>
      {species.fluff && (
        <p className="mb-3 border-l-2 border-emerald-800/40 pl-2 text-xs italic leading-relaxed text-muted-foreground whitespace-pre-line">
          {species.fluff}
        </p>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <SpeciesBonuses
          baseSummary={species.abilitySummary}
          subspeciesSummary={subspeciesAbilitySummary}
        />
        {species.darkvision !== undefined && (
          <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5">
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Visión en la oscuridad
            </p>
            <p className="font-medium text-foreground">
              {species.darkvision} ft.
            </p>
          </div>
        )}
        {(resistances.length > 0 || species.resistanceSummary) && (
          <div className="col-span-2 rounded-md border border-border bg-muted/20 px-2 py-1.5">
            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Resistencias
            </p>
            <p className="font-medium capitalize text-foreground">
              {[...resistances, species.resistanceSummary]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}
      </div>

      {traitTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {traitTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <TraitList
        traits={traits}
        heading="Species Traits"
        headingClass="text-emerald-400"
        traitNameClass="text-foreground"
      />

      {subspeciesTraits.length > 0 && (
        <TraitList
          traits={subspeciesTraits}
          heading={
            subspeciesLabel
              ? `Subspecies Traits — ${subspeciesLabel}`
              : "Subspecies Traits"
          }
          headingClass="text-sky-400"
          traitNameClass="text-sky-300"
          bodyClass="text-sky-100/70"
          containerClass="subspecies-trait"
        />
      )}
    </>
  );
}

function BackgroundDetailBody({
  background,
  abilitySummary,
  featSummary,
  startingEquipmentOffers,
  startingEquipmentSource,
}: {
  background: Background;
  abilitySummary?: string | null;
  featSummary?: string | null;
  startingEquipmentOffers?: StartingEquipmentOffers;
  startingEquipmentSource?: StartingEquipmentSource;
}) {
  const asiSummary =
    abilitySummary && abilitySummary !== "—" ? abilitySummary : null;
  const originFeatSummary =
    featSummary && featSummary !== "—" ? featSummary : null;

  return (
    <>
      {background.fluff && (
        <p className="mb-3 border-l-2 border-sky-800/40 pl-2 text-xs italic leading-relaxed text-muted-foreground whitespace-pre-line">
          {background.fluff}
        </p>
      )}

      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-sky-400">
        Proficiencies
      </h3>
      <div className="mb-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5 sm:col-span-2">
          {asiSummary && (
            <div className="mb-3">
              <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Ability Scores
              </p>
              <p className="font-medium text-foreground">{asiSummary}</p>
            </div>
          )}
          <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Skills
          </p>
          <p className="font-medium text-foreground">
            {background.proficiencies.skills}
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5">
          <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Tools
          </p>
          <p className="font-medium text-foreground">
            {background.proficiencies.tools}
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5">
          <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Languages
          </p>
          <p className="font-medium text-foreground">
            {background.proficiencies.languages}
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5 sm:col-span-2">
          <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Initial Equipment
          </p>
          <p className="text-xs font-medium leading-relaxed text-foreground">
            {background.proficiencies.equipment}
          </p>
        </div>
      </div>

      {originFeatSummary && (
        <div className="mb-3 rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs">
          <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Origin Feat
          </p>
          <p className="font-medium text-foreground">{originFeatSummary}</p>
        </div>
      )}

      {startingEquipmentOffers &&
        startingEquipmentSource &&
        hasStartingEquipmentOffers(startingEquipmentOffers) && (
          <div className="mb-3">
            <StartingEquipmentPicker
              offers={startingEquipmentOffers}
              source={startingEquipmentSource}
            />
          </div>
        )}

      <Separator className="my-3" />

      <BackgroundSectionBlock
        sections={background.features}
        heading="Background Features"
        accentClass="text-sky-400"
      />

      {background.suggestedCharacteristics?.length ? (
        <>
          <Separator className="my-3" />
          <BackgroundSectionBlock
            sections={background.suggestedCharacteristics}
            heading="Suggested Characteristics"
            accentClass="text-violet-400"
          />
        </>
      ) : null}
    </>
  );
}

export function IdentityLibraryDetail({
  species,
  background,
  backgroundAbilitySummary,
  backgroundFeatSummary,
  sourceVariants,
  activeSourceId,
  onSourceSelect,
  subspeciesOptions,
  activeSubspeciesId = null,
  onSubspeciesSelect,
  subspeciesTraits = [],
  subspeciesLabel,
  subspeciesAbilitySummary,
  bookNames = {},
  startingEquipmentOffers,
  startingEquipmentSource,
}: IdentityLibraryDetailProps) {
  const isSpecies = !!species;
  const name = species?.name ?? background?.name ?? "";
  const accentClass = isSpecies ? "text-emerald-400" : "text-sky-400";
  const Icon = isSpecies ? Users : ScrollText;
  const displayName =
    isSpecies && subspeciesLabel ? `${name} (${subspeciesLabel})` : name;

  return (
    <Accordion type="single" collapsible defaultValue="identity-details">
      <AccordionItem value="identity-details" className="border-0">
        <AccordionTrigger className="gap-1.5 py-2 text-xs font-medium hover:no-underline">
          <span className={`flex min-w-0 items-center gap-1.5 ${accentClass}`}>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{displayName}</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-1 pt-0">
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
          {subspeciesOptions && onSubspeciesSelect && (
            <NamedVariantSwitcher
              options={subspeciesOptions}
              activeId={activeSubspeciesId}
              onSelect={onSubspeciesSelect}
              accent="sky"
              className="mb-2"
            />
          )}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {species && (
              <>
                {species.category &&
                  SPECIES_CATEGORY_LABELS[species.category] && (
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
                {species.sizes?.length ? (
                  <Badge variant="outline" className="text-[10px]">
                    {species.sizes.join(", ")}
                  </Badge>
                ) : null}
                {species.speed ? (
                  <Badge variant="outline" className="text-[10px]">
                    {species.speed}
                  </Badge>
                ) : null}
              </>
            )}
            {background && (
              <Badge variant="secondary" className="text-[10px]">
                {BACKGROUND_FACTION_LABELS[background.faction]}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {species?.source ?? background?.source}
              {(species?.page ?? background?.page) !== undefined
                ? ` p.${species?.page ?? background?.page}`
                : ""}
            </span>
          </div>

          {species && (
            <SpeciesDetailBody
              species={species}
              subspeciesTraits={subspeciesTraits}
              subspeciesLabel={subspeciesLabel}
              subspeciesAbilitySummary={subspeciesAbilitySummary}
            />
          )}
          {background && (
            <BackgroundDetailBody
              background={background}
              abilitySummary={backgroundAbilitySummary}
              featSummary={backgroundFeatSummary}
              startingEquipmentOffers={startingEquipmentOffers}
              startingEquipmentSource={startingEquipmentSource}
            />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
