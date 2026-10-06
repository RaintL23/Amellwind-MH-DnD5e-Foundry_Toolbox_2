/**
 * Single renderer for background content (D&D + Amellwind), used by the
 * compendium dialogs and the Builder library. Hosts own the header/shell;
 * character-specific UI (starting equipment picker) goes in `equipmentSlot`.
 */
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { DndMarkupTable } from "@/shared/components/DndMarkupTable";
import { DndRichText } from "@/shared/components/DndRichText";
import {
  LibraryProficiencySummary,
  ProficiencyGrantBadge,
  ProficiencyHighlightFrame,
} from "@/shared/components/LibraryProficiencyHighlight";
import type {
  BackgroundSection,
  DndBackgroundFeatRef,
  DndFeat,
} from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  resolveBackgroundDisplay,
  type BackgroundContentData,
} from "@/shared/utils/background-display.utils";
import { entriesMentionProficiencyGrant } from "@/shared/utils/library-proficiency-highlight.utils";
import { resolveDndFeatForRef } from "@/features/dnd/feats/services/dnd-feat.service";
import { DndFeatInlineContent } from "@/features/dnd/feats/components/DndFeatDetailDialog";

export type BackgroundContentDensity = "compact" | "comfortable";
export type BackgroundContentAccent = "amber" | "sky";

const DENSITY = {
  compact: {
    text: "text-xs",
    sectionHeading: "mb-2 text-[10px]",
    grid: "mb-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2",
    card: "px-2 py-1.5",
    fluff: "mb-3 pl-2 text-xs",
    sectionGap: "space-y-3",
    separator: "my-3",
  },
  comfortable: {
    text: "text-sm",
    sectionHeading: "mb-3 text-xs",
    grid: "mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2",
    card: "px-3 py-2",
    fluff: "mb-4 pl-3 text-sm",
    sectionGap: "space-y-4",
    separator: "my-4",
  },
} as const;

const ACCENT = {
  amber: { heading: "text-amber-400", fluffBorder: "border-amber-800/40" },
  sky: { heading: "text-sky-400", fluffBorder: "border-sky-800/40" },
} as const;

type DensityStyles = (typeof DENSITY)[BackgroundContentDensity];

export interface BackgroundContentProps {
  background: BackgroundContentData;
  /** Character-specific block rendered after the proficiency cards. */
  equipmentSlot?: ReactNode;
  density?: BackgroundContentDensity;
  accent?: BackgroundContentAccent;
}

function SectionBlock({
  sections,
  heading,
  headingClass,
  styles,
}: {
  sections: BackgroundSection[];
  heading: string;
  headingClass: string;
  styles: DensityStyles;
}) {
  return (
    <>
      <h3
        className={cn(
          "font-bold uppercase tracking-wider",
          styles.sectionHeading,
          headingClass,
        )}
      >
        {heading}
      </h3>
      <div className={styles.sectionGap}>
        {sections.map((section) => {
          const grantsProficiency = entriesMentionProficiencyGrant(
            section.entries,
          );
          return (
            <ProficiencyHighlightFrame
              key={section.name}
              active={grantsProficiency}
            >
              <div>
                <h4
                  className={cn(
                    "mb-1 flex flex-wrap items-center gap-1.5 font-semibold text-foreground",
                    styles.text,
                  )}
                >
                  {section.name}
                  {grantsProficiency && <ProficiencyGrantBadge />}
                </h4>
                {section.entries?.map((paragraph, i) => (
                  <p
                    key={`${section.name}-entry-${i}`}
                    className={cn(
                      "mb-1 leading-relaxed text-muted-foreground",
                      styles.text,
                    )}
                  >
                    <DndRichText text={paragraph} />
                  </p>
                ))}
                {section.tables?.map((table, i) => (
                  <DndMarkupTable
                    key={table.caption ?? `${section.name}-table-${i}`}
                    caption={table.caption}
                    colLabels={table.colLabels}
                    rows={table.rows}
                  />
                ))}
              </div>
            </ProficiencyHighlightFrame>
          );
        })}
      </div>
    </>
  );
}

type LoadedFeat = { refId: string; feat?: DndFeat; loading: boolean };

function OriginFeatDetails({ featRefs }: { featRefs: DndBackgroundFeatRef[] }) {
  const [loaded, setLoaded] = useState<LoadedFeat[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(featRefs.map((ref) => ({ refId: ref.id, loading: true })));
    void Promise.all(
      featRefs.map(async (ref) => ({
        refId: ref.id,
        feat: await resolveDndFeatForRef(ref),
        loading: false,
      })),
    ).then((result) => {
      if (!cancelled) setLoaded(result);
    });
    return () => {
      cancelled = true;
    };
  }, [featRefs]);

  return (
    <>
      {loaded.map((entry) => {
        if (entry.loading) {
          return (
            <div
              key={entry.refId}
              className="rounded-md border border-border bg-muted/10 px-3 py-3 text-xs text-muted-foreground"
            >
              Loading feat details…
            </div>
          );
        }
        if (!entry.feat) return null;
        return <DndFeatInlineContent key={entry.refId} feat={entry.feat} />;
      })}
    </>
  );
}

export function BackgroundContent({
  background,
  equipmentSlot,
  density = "compact",
  accent = "sky",
}: BackgroundContentProps) {
  const styles = DENSITY[density];
  const accentStyles = ACCENT[accent];
  const display = resolveBackgroundDisplay(background);
  const featRefs =
    background.featRefs ??
    (background.originFeatGrant?.kind === "fixed"
      ? background.originFeatGrant.featRefs
      : []);

  const card = cn("rounded-md border border-border bg-muted/20", styles.card);
  const cardLabel =
    "mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground";

  return (
    <>
      {background.fluff && (
        <p
          className={cn(
            "whitespace-pre-line border-l-2 italic leading-relaxed text-muted-foreground",
            styles.fluff,
            accentStyles.fluffBorder,
          )}
        >
          {background.fluff}
        </p>
      )}

      <LibraryProficiencySummary
        rows={display.proficiencyRows}
        className="mb-3"
      />

      <h3
        className={cn(
          "font-bold uppercase tracking-wider",
          styles.sectionHeading,
          accentStyles.heading,
        )}
      >
        Proficiencies
      </h3>
      <div className={styles.grid}>
        {display.abilitySummary && (
          <div className={cn(card, "sm:col-span-2")}>
            <p className={cardLabel}>Ability Scores</p>
            <p className="font-medium text-foreground">
              {display.abilitySummary}
            </p>
          </div>
        )}
        {display.proficiencyFields.map((field) => (
          <div
            key={field.label}
            className={cn(card, field.wide && "sm:col-span-2")}
          >
            <p className={cardLabel}>{field.label}</p>
            <p className="font-medium leading-relaxed text-foreground">
              {field.value}
            </p>
          </div>
        ))}
        {featRefs.length > 0 ? (
          <Collapsible className={cn(card, "sm:col-span-2")}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left">
              <div className="min-w-0">
                <p className={cardLabel}>Origin Feat</p>
                <p className="font-medium text-foreground">
                  {display.originFeatSummary ??
                    featRefs.map((ref) => ref.displayLabel).join("; ")}
                </p>
              </div>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              <OriginFeatDetails featRefs={featRefs} />
            </CollapsibleContent>
          </Collapsible>
        ) : display.originFeatSummary ? (
          <div className={cn(card, "sm:col-span-2")}>
            <p className={cardLabel}>Origin Feat</p>
            <p className="font-medium text-foreground">
              {display.originFeatSummary}
            </p>
          </div>
        ) : null}
      </div>

      {equipmentSlot}

      {background.features.length > 0 && (
        <>
          <Separator className={styles.separator} />
          <SectionBlock
            sections={background.features}
            heading="Background Features"
            headingClass={accentStyles.heading}
            styles={styles}
          />
        </>
      )}

      {background.suggestedCharacteristics.length > 0 && (
        <>
          <Separator className={styles.separator} />
          <SectionBlock
            sections={background.suggestedCharacteristics}
            heading="Suggested Characteristics"
            headingClass="text-violet-400"
            styles={styles}
          />
        </>
      )}
    </>
  );
}
