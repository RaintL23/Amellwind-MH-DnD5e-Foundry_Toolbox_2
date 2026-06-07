import { useEffect, useMemo, useState } from "react";
import type { DndRace } from "@/shared/types";
import { DND_RACE_KIND_LABELS } from "@/shared/types";
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

interface DndRaceDetailDialogProps {
  race: DndRace | null;
  variants?: DndRace[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TraitTable({
  caption,
  colLabels,
  rows,
}: {
  caption?: string;
  colLabels: string[];
  rows: string[][];
}) {
  return (
    <div className="my-3 overflow-x-auto rounded-md border border-border">
      {caption && (
        <p className="px-3 py-2 text-xs font-semibold text-emerald-400/90 border-b border-border bg-muted/30">
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
  variants: DndRace[];
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
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
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

function RaceBody({ race }: { race: DndRace }) {
  return (
    <>
      {race.fluff && (
        <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-emerald-800/40 pl-3 whitespace-pre-line">
          {race.fluff}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
        {race.abilitySummary && race.abilitySummary !== "—" && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Ability Bonuses
            </p>
            <p className="font-medium text-foreground">{race.abilitySummary}</p>
          </div>
        )}
        {race.darkvision !== undefined && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Darkvision
            </p>
            <p className="font-medium text-foreground">{race.darkvision} ft.</p>
          </div>
        )}
        {(race.resistances.length > 0 || race.resistanceSummary) && (
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Resistances
            </p>
            <p className="font-medium text-foreground capitalize">
              {[...race.resistances, race.resistanceSummary].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
      </div>

      {race.traitTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {race.traitTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {race.traits.length > 0 && (
        <>
          <Separator className="my-4" />
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            Racial Traits
          </h3>
          <div className="space-y-4">
            {race.traits.map((trait) => (
              <div key={trait.name}>
                <h4 className="text-sm font-semibold text-foreground mb-1">{trait.name}</h4>
                {trait.entries.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-sm text-muted-foreground leading-relaxed mb-1"
                  >
                    {parseFiveToolsMarkup(paragraph)}
                  </p>
                ))}
                {trait.tables?.map((table, i) => (
                  <TraitTable
                    key={i}
                    caption={table.caption}
                    colLabels={table.colLabels}
                    rows={table.rows}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function DndRaceDetailDialog({
  race: raceProp,
  variants: variantsProp,
  open,
  onOpenChange,
}: DndRaceDetailDialogProps) {
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
  }, []);

  const variants = useMemo(() => {
    if (!variantsProp || variantsProp.length === 0) return raceProp ? [raceProp] : [];
    return [...variantsProp].sort((a, b) => a.source.localeCompare(b.source));
  }, [variantsProp, raceProp]);

  useEffect(() => {
    if (raceProp) setActiveId(raceProp.id);
  }, [raceProp]);

  const activeRace = useMemo(
    () => variants.find((v) => v.id === activeId) ?? variants[0] ?? raceProp,
    [variants, activeId, raceProp],
  );

  if (!activeRace) return null;

  const sourceName = resolveBookSourceName(bookNames, activeRace.source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 text-2xl">{activeRace.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{DND_RACE_KIND_LABELS[activeRace.kind]}</Badge>
              {activeRace.parentName && (
                <Badge variant="outline">
                  {activeRace.parentName}
                  {activeRace.parentSource ? ` (${activeRace.parentSource})` : ""}
                </Badge>
              )}
              <Badge variant="outline">{activeRace.sizes.join(", ")}</Badge>
              <Badge variant="outline">{activeRace.speed}</Badge>
              <span
                className="text-xs text-muted-foreground"
                title={sourceName !== activeRace.source ? sourceName : undefined}
              >
                {activeRace.source}
                {activeRace.page !== undefined ? ` p.${activeRace.page}` : ""}
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

          <RaceBody race={activeRace} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
