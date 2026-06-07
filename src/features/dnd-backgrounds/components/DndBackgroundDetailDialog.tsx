import { useEffect, useMemo, useState } from "react";
import type { DndBackground, BackgroundTable, DndFeat } from "@/shared/types";
import { DND_BACKGROUND_EDITION_LABELS } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/shared/utils/cn";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { resolveDndFeatForRef } from "@/features/dnd-feats/services/dnd-feat.service";
import { DndFeatInlineContent } from "@/features/dnd-feats/components/DndFeatDetailDialog";

interface DndBackgroundDetailDialogProps {
  background: DndBackground | null;
  variants?: DndBackground[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RollTable({ caption, colLabels, rows }: BackgroundTable) {
  return (
    <div className="my-3 overflow-x-auto rounded-md border border-border">
      {caption && (
        <p className="px-3 py-2 text-xs font-semibold text-amber-400/90 border-b border-border bg-muted/30">
          {caption}
        </p>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {colLabels.map((label) => (
              <th
                key={label}
                className="px-3 py-2 text-left font-semibold text-muted-foreground"
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
                <td key={j} className="px-3 py-2 text-foreground/90">
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

function SourceSwitcher({
  variants,
  activeId,
  onSelect,
  bookNames,
}: {
  variants: DndBackground[];
  activeId: string;
  onSelect: (id: string) => void;
  bookNames: BookSourceNameMap;
}) {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Source
      </p>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const isActive = v.id === activeId;
          const sourceTitle = resolveBookSourceName(bookNames, v.source);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              title={sourceTitle !== v.source ? sourceTitle : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {v.source}
              {v.page !== undefined && (
                <span className="ml-1 opacity-70">p.{v.page}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionBlock({
  sections,
  heading,
  accentClass,
}: {
  sections: DndBackground["features"];
  heading: string;
  accentClass: string;
}) {
  if (!sections.length) return null;

  return (
    <>
      <h3
        className={`text-xs font-bold uppercase tracking-wider mb-3 ${accentClass}`}
      >
        {heading}
      </h3>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.name}>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {section.name}
            </h4>
            {section.entries.map((paragraph, i) => (
              <p
                key={i}
                className="text-sm text-muted-foreground leading-relaxed mb-1"
              >
                {parseFiveToolsMarkup(paragraph)}
              </p>
            ))}
            {section.tables?.map((table, i) => (
              <RollTable key={i} {...table} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function OriginFeatSection({ background }: { background: DndBackground }) {
  const [loadedFeats, setLoadedFeats] = useState<
    Array<{ refId: string; feat?: DndFeat; loading: boolean }>
  >([]);

  useEffect(() => {
    if (!background.featRefs?.length) {
      setLoadedFeats([]);
      return;
    }

    setLoadedFeats(
      background.featRefs.map((ref) => ({
        refId: ref.id,
        loading: true,
      })),
    );

    void Promise.all(
      background.featRefs.map(async (ref) => ({
        refId: ref.id,
        feat: await resolveDndFeatForRef(ref),
        loading: false,
      })),
    ).then(setLoadedFeats);
  }, [background.id, background.featRefs]);

  if (!background.featSummary && !background.featRefs?.length) return null;

  return (
    <div className="sm:col-span-2 space-y-3">
      <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
          Origin Feat
        </p>
        <p className="font-medium text-foreground">{background.featSummary}</p>
      </div>

      {loadedFeats.map((entry) => {
        if (entry.loading) {
          return (
            <div
              key={entry.refId}
              className="rounded-md border border-border bg-muted/10 px-3 py-4 text-sm text-muted-foreground"
            >
              Loading feat details…
            </div>
          );
        }
        if (!entry.feat) return null;
        return <DndFeatInlineContent key={entry.refId} feat={entry.feat} />;
      })}
    </div>
  );
}

function BackgroundBody({ background }: { background: DndBackground }) {
  return (
    <>
      {background.fluff && (
        <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-amber-800/40 pl-3 whitespace-pre-line">
          {background.fluff}
        </p>
      )}

      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
        Proficiencies
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 sm:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            Skills
          </p>
          <p className="font-medium text-foreground">
            {background.proficiencies.skills}
          </p>
        </div>
        {background.proficiencies.tools !== "—" && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Tools
            </p>
            <p className="font-medium text-foreground">
              {background.proficiencies.tools}
            </p>
          </div>
        )}
        {background.proficiencies.languages !== "—" && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Languages
            </p>
            <p className="font-medium text-foreground">
              {background.proficiencies.languages}
            </p>
          </div>
        )}
        {background.abilitySummary && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Ability Scores
            </p>
            <p className="font-medium text-foreground">{background.abilitySummary}</p>
          </div>
        )}
        {(background.featSummary || background.featRefs?.length) && (
          <OriginFeatSection background={background} />
        )}
        {background.proficiencies.equipment !== "—" && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Equipment
            </p>
            <p className="font-medium text-foreground text-sm leading-relaxed">
              {background.proficiencies.equipment}
            </p>
          </div>
        )}
      </div>

      {background.features.length > 0 && (
        <>
          <Separator className="my-4" />
          <SectionBlock
            sections={background.features}
            heading="Background Features"
            accentClass="text-amber-400"
          />
        </>
      )}

      {background.suggestedCharacteristics.length > 0 && (
        <>
          <Separator className="my-4" />
          <SectionBlock
            sections={background.suggestedCharacteristics}
            heading="Suggested Characteristics"
            accentClass="text-violet-400"
          />
        </>
      )}
    </>
  );
}

export function DndBackgroundDetailDialog({
  background: backgroundProp,
  variants: variantsProp,
  open,
  onOpenChange,
}: DndBackgroundDetailDialogProps) {
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
  }, []);

  const variants = useMemo(() => {
    if (!variantsProp || variantsProp.length === 0) {
      return backgroundProp ? [backgroundProp] : [];
    }
    return [...variantsProp].sort((a, b) => a.source.localeCompare(b.source));
  }, [variantsProp, backgroundProp]);

  useEffect(() => {
    if (backgroundProp) setActiveId(backgroundProp.id);
  }, [backgroundProp]);

  const activeBackground = useMemo(
    () => variants.find((v) => v.id === activeId) ?? variants[0] ?? backgroundProp,
    [variants, activeId, backgroundProp],
  );

  if (!activeBackground) return null;

  const sourceName = resolveBookSourceName(bookNames, activeBackground.source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-2xl">
            {activeBackground.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              {activeBackground.edition && (
                <Badge variant="secondary">
                  {DND_BACKGROUND_EDITION_LABELS[activeBackground.edition]}
                </Badge>
              )}
              {activeBackground.srd && <Badge variant="outline">SRD</Badge>}
              {activeBackground.basicRules && (
                <Badge variant="outline">Basic Rules</Badge>
              )}
              <span
                className="text-xs text-muted-foreground"
                title={sourceName !== activeBackground.source ? sourceName : undefined}
              >
                {activeBackground.source}
                {activeBackground.page !== undefined
                  ? ` p.${activeBackground.page}`
                  : ""}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {variants.length > 1 && (
            <>
              <SourceSwitcher
                variants={variants}
                activeId={activeId}
                onSelect={setActiveId}
                bookNames={bookNames}
              />
              <Separator className="my-4" />
            </>
          )}

          <BackgroundBody background={activeBackground} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
