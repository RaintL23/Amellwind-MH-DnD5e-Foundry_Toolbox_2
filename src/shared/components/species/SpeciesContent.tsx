/**
 * Single renderer for species content (D&D races + Amellwind species), used by
 * the compendium dialogs and the Builder library. Hosts own the header/shell;
 * interactive pickers appear only when the host passes the matching handler.
 */
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DndMarkupTable } from "@/shared/components/DndMarkupTable";
import { DndRichText } from "@/shared/components/DndRichText";
import {
  LibraryProficiencySummary,
  ProficiencyGrantBadge,
  ProficiencyHighlightFrame,
} from "@/shared/components/LibraryProficiencyHighlight";
import {
  NamedVariantSwitcher,
  type NamedVariant,
} from "@/shared/components/NamedVariantSwitcher";
import type { SpeciesTrait } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { entriesMentionProficiencyGrant } from "@/shared/utils/library-proficiency-highlight.utils";
import {
  resolveSpeciesDisplayStats,
  type SpeciesContentData,
} from "@/shared/utils/species-display.utils";
import {
  combineSpeciesSpellGrantSource,
  resolveActiveSpellGroup,
} from "@/shared/utils/species-spell-groups.utils";
import {
  resolveSpeciesTraitEntries,
  speciesTraitChoiceKey,
} from "@/shared/utils/species-trait-choice.utils";

export type SpeciesContentDensity = "compact" | "comfortable";

const DENSITY = {
  compact: {
    text: "text-xs",
    sectionHeading: "mb-2 text-[10px]",
    statGrid: "mb-3 grid grid-cols-2 gap-2 text-xs",
    statCard: "px-2 py-1.5",
    fluff: "mb-3 pl-2 text-xs",
    traitGap: "space-y-3",
    separator: "my-3",
  },
  comfortable: {
    text: "text-sm",
    sectionHeading: "mb-3 text-xs",
    statGrid: "mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3",
    statCard: "px-3 py-2",
    fluff: "mb-4 pl-3 text-sm",
    traitGap: "space-y-4",
    separator: "my-4",
  },
} as const;

type DensityStyles = (typeof DENSITY)[SpeciesContentDensity];

export interface SpeciesContentProps {
  species: SpeciesContentData;
  /** Selected subspecies / subrace data, merged into stats and listed below. */
  subspecies?: SpeciesContentData | null;
  subspeciesOptions?: NamedVariant[];
  activeSubspeciesId?: string | null;
  onSubspeciesSelect?: (id: string | null) => void;
  /** Selected named spell group (Tiefling legacy, Gnome lineage, …). */
  activeLegacyId?: string | null;
  onLegacySelect?: (name: string | null) => void;
  /** Permanent trait option picks keyed by trait name (Goliath Giant Ancestry, …). */
  traitChoices?: Record<string, string>;
  /** When set, creation-choice traits become pickers and hide unpicked options. */
  onTraitChoiceSelect?: (traitName: string, optionId: string | null) => void;
  density?: SpeciesContentDensity;
}

function StatCard({
  label,
  styles,
  className,
  children,
}: {
  label: string;
  styles: DensityStyles;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-muted/20",
        styles.statCard,
        className,
      )}
    >
      <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function TraitList({
  traits,
  variant,
  styles,
  traitChoices,
  onTraitChoiceSelect,
}: {
  traits: SpeciesTrait[];
  variant: "species" | "subspecies";
  styles: DensityStyles;
  traitChoices?: Record<string, string>;
  onTraitChoiceSelect?: (traitName: string, optionId: string | null) => void;
}) {
  const isSub = variant === "subspecies";

  return (
    <div className={styles.traitGap}>
      {traits.map((trait) => {
        const choice = trait.creationChoice;
        const selectedId =
          traitChoices?.[speciesTraitChoiceKey(trait.name)] ?? null;
        const displayEntries = resolveSpeciesTraitEntries(trait, selectedId, {
          showAllWhenUnselected: !onTraitChoiceSelect,
        });
        const grantsProficiency = entriesMentionProficiencyGrant(displayEntries);

        const body = (
          <div
            className={cn(
              isSub && "rounded-md border px-2 py-1.5",
              isSub &&
                (grantsProficiency
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-sky-500/20 bg-sky-500/5"),
            )}
          >
            <h4
              className={cn(
                "mb-1 flex flex-wrap items-center gap-1.5 font-semibold",
                styles.text,
                isSub ? "text-sky-300" : "text-foreground",
              )}
            >
              {trait.name}
              {grantsProficiency && <ProficiencyGrantBadge />}
            </h4>
            {choice && onTraitChoiceSelect && (
              <NamedVariantSwitcher
                label="Choose one"
                options={choice.options.map((option) => ({
                  id: option.id,
                  name: option.name,
                }))}
                activeId={selectedId}
                onSelect={(id) => onTraitChoiceSelect(trait.name, id)}
                accent={isSub ? "sky" : "emerald"}
                includeBaseOption={false}
                className="mb-2 mt-1"
              />
            )}
            {displayEntries.map((paragraph, i) => (
              <p
                key={`${trait.name}-entry-${i}`}
                className={cn(
                  "mb-1 leading-relaxed",
                  styles.text,
                  isSub ? "text-sky-100/70" : "text-muted-foreground",
                )}
              >
                <DndRichText text={paragraph} />
              </p>
            ))}
            {trait.tables?.map((table, i) => (
              <DndMarkupTable
                key={table.caption ?? `${trait.name}-table-${i}`}
                caption={table.caption}
                colLabels={table.colLabels}
                rows={table.rows}
                captionClassName="text-emerald-400/90"
              />
            ))}
          </div>
        );

        return isSub ? (
          <div key={trait.name}>{body}</div>
        ) : (
          <ProficiencyHighlightFrame key={trait.name} active={grantsProficiency}>
            {body}
          </ProficiencyHighlightFrame>
        );
      })}
    </div>
  );
}

export function SpeciesContent({
  species,
  subspecies = null,
  subspeciesOptions,
  activeSubspeciesId = null,
  onSubspeciesSelect,
  activeLegacyId = null,
  onLegacySelect,
  traitChoices,
  onTraitChoiceSelect,
  density = "compact",
}: SpeciesContentProps) {
  const styles = DENSITY[density];
  const stats = resolveSpeciesDisplayStats(species, subspecies);

  const spellSource = combineSpeciesSpellGrantSource(species, subspecies);
  const spellGroups = spellSource?.namedSpellGroups ?? [];
  const legacyLabel =
    subspecies?.namedSpellGroupsLabel ?? species.namedSpellGroupsLabel;
  const activeLegacy = spellSource
    ? resolveActiveSpellGroup(spellSource, activeLegacyId)
    : null;
  const grantedSpells = [
    ...new Set([
      ...(spellSource?.universalCantrips ?? []),
      ...(activeLegacy?.cantrips ?? []),
      ...(activeLegacy?.innateSpells?.map((spell) => spell.name) ?? []),
    ]),
  ];

  const resistanceText = activeLegacy?.resistance
    ? activeLegacy.resistance
    : [...stats.resistances, stats.resistanceSummary]
        .filter(Boolean)
        .join(" · ");

  const subspeciesFluff =
    subspecies?.fluff && subspecies.fluff !== species.fluff
      ? subspecies.fluff
      : null;
  const subspeciesTraits = subspecies?.traits ?? [];

  return (
    <>
      {subspeciesOptions && subspeciesOptions.length > 0 && onSubspeciesSelect && (
        <NamedVariantSwitcher
          label="Subspecies"
          options={subspeciesOptions}
          activeId={activeSubspeciesId}
          onSelect={onSubspeciesSelect}
          accent="sky"
          className="mb-3"
        />
      )}
      {spellGroups.length > 1 && onLegacySelect && (
        <NamedVariantSwitcher
          label={legacyLabel ?? "Lineage"}
          options={spellGroups.map((group) => ({
            id: group.name,
            name: group.name,
          }))}
          activeId={activeLegacyId}
          onSelect={onLegacySelect}
          accent="violet"
          includeBaseOption={false}
          className="mb-3"
        />
      )}

      {species.fluff && (
        <p
          className={cn(
            "whitespace-pre-line border-l-2 border-emerald-800/40 italic leading-relaxed text-muted-foreground",
            styles.fluff,
          )}
        >
          {species.fluff}
        </p>
      )}

      <LibraryProficiencySummary rows={stats.proficiencyRows} className="mb-3" />

      <div className={styles.statGrid}>
        {(stats.baseAbilitySummary || stats.subspeciesAbilitySummary) && (
          <StatCard label="Ability Bonuses" styles={styles}>
            <p className="font-medium">
              {stats.baseAbilitySummary && (
                <span className="text-foreground">{stats.baseAbilitySummary}</span>
              )}
              {stats.baseAbilitySummary && stats.subspeciesAbilitySummary && (
                <span className="text-muted-foreground"> · </span>
              )}
              {stats.subspeciesAbilitySummary && (
                <span className="text-sky-300">
                  {stats.subspeciesAbilitySummary}
                </span>
              )}
            </p>
          </StatCard>
        )}
        {stats.darkvision !== undefined && (
          <StatCard label="Darkvision" styles={styles}>
            <p className="font-medium text-foreground">{stats.darkvision} ft.</p>
          </StatCard>
        )}
        {resistanceText && (
          <StatCard label="Resistances" styles={styles} className="col-span-2 sm:col-span-1">
            <p className="font-medium capitalize text-foreground">
              {resistanceText}
            </p>
          </StatCard>
        )}
      </div>

      {grantedSpells.length > 0 && (
        <div className="mb-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
            <Sparkles className="h-3 w-3" aria-hidden />
            Spells granted by lineage
          </p>
          <div className="flex flex-wrap gap-1">
            {grantedSpells.map((spellName) => (
              <Badge
                key={spellName}
                variant="outline"
                className="border-amber-500/40 text-[10px] text-amber-300"
              >
                {spellName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {activeLegacy?.entries?.length ? (
        <div className="mb-3 rounded-md border border-border bg-muted/20 px-2 py-1.5">
          <h4 className={cn("mb-1 font-semibold text-violet-300", styles.text)}>
            {activeLegacy.name}
          </h4>
          {activeLegacy.entries.map((paragraph, index) => (
            <p
              key={`${activeLegacy.name}-entry-${index}`}
              className={cn(
                "mb-1 leading-relaxed text-muted-foreground last:mb-0",
                styles.text,
              )}
            >
              <DndRichText text={paragraph} />
            </p>
          ))}
        </div>
      ) : null}

      {stats.traitTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {stats.traitTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {species.traits.length > 0 && (
        <>
          <Separator className={styles.separator} />
          <h3
            className={cn(
              "font-bold uppercase tracking-wider text-emerald-400",
              styles.sectionHeading,
            )}
          >
            Traits
          </h3>
          <TraitList
            traits={species.traits}
            variant="species"
            styles={styles}
            traitChoices={traitChoices}
            onTraitChoiceSelect={onTraitChoiceSelect}
          />
        </>
      )}

      {subspecies && (subspeciesFluff || subspeciesTraits.length > 0) && (
        <>
          <Separator className={styles.separator} />
          <h3
            className={cn(
              "font-bold uppercase tracking-wider text-sky-400",
              styles.sectionHeading,
            )}
          >
            Subspecies — {subspecies.name}
          </h3>
          {subspeciesFluff && (
            <p
              className={cn(
                "whitespace-pre-line border-l-2 border-sky-800/40 italic leading-relaxed text-muted-foreground",
                styles.fluff,
              )}
            >
              {subspeciesFluff}
            </p>
          )}
          <TraitList
            traits={subspeciesTraits}
            variant="subspecies"
            styles={styles}
            traitChoices={traitChoices}
            onTraitChoiceSelect={onTraitChoiceSelect}
          />
        </>
      )}
    </>
  );
}
