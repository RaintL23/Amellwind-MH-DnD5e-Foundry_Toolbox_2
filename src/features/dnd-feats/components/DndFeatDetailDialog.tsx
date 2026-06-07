import { useEffect, useMemo, useState } from "react";
import type { DndFeat } from "@/shared/types";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types";
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
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { FeatParagraphList, FeatSectionBlock } from "./DndFeatContent";

interface DndFeatDetailDialogProps {
  feat: DndFeat | null;
  variants?: DndFeat[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SourceSwitcher({
  variants,
  activeId,
  onSelect,
  bookNames,
}: {
  variants: DndFeat[];
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

export function DndFeatDetailDialog({
  feat: featProp,
  variants: variantsProp,
  open,
  onOpenChange,
}: DndFeatDetailDialogProps) {
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
  }, []);

  const variants = useMemo(() => {
    if (!variantsProp || variantsProp.length === 0) {
      return featProp ? [featProp] : [];
    }
    return [...variantsProp].sort((a, b) => a.source.localeCompare(b.source));
  }, [variantsProp, featProp]);

  useEffect(() => {
    if (featProp) setActiveId(featProp.id);
  }, [featProp]);

  const activeFeat = useMemo(
    () => variants.find((v) => v.id === activeId) ?? variants[0] ?? featProp,
    [variants, activeId, featProp],
  );

  if (!activeFeat) return null;

  const sourceName = resolveBookSourceName(bookNames, activeFeat.source);
  const categoryLabel = activeFeat.category
    ? DND_FEAT_CATEGORY_LABELS[activeFeat.category] ?? activeFeat.category
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-amber-400 text-2xl">
            {activeFeat.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">Feat · {activeFeat.source}</Badge>
              {activeFeat.isOriginFeat && (
                <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/50">
                  Origin Feat
                </Badge>
              )}
              {categoryLabel && !activeFeat.isOriginFeat && (
                <Badge variant="outline">{categoryLabel}</Badge>
              )}
              {activeFeat.repeatable && (
                <Badge className="bg-violet-950/60 text-violet-300 border-violet-800/50">
                  Repetible
                </Badge>
              )}
              {activeFeat.srd52 && <Badge variant="outline">SRD 5.2</Badge>}
              {activeFeat.basicRules2024 && (
                <Badge variant="outline">Basic Rules 2024</Badge>
              )}
              <span
                className="text-xs text-muted-foreground"
                title={sourceName !== activeFeat.source ? sourceName : undefined}
              >
                {activeFeat.page !== undefined ? `p.${activeFeat.page}` : ""}
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

          {(activeFeat.prerequisites.length > 0 ||
            activeFeat.abilityIncreases.length > 0) && (
            <>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                Requisitos y bonificaciones
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFeat.prerequisites.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {p}
                  </span>
                ))}
                {activeFeat.abilityIncreases.map((a) => (
                  <span
                    key={a.label}
                    className="rounded-md border border-emerald-800/40 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-400"
                  >
                    {a.label}
                  </span>
                ))}
              </div>
              <Separator className="my-4" />
            </>
          )}

          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            Descripción
          </h3>
          <FeatParagraphList lines={activeFeat.paragraphs} />
          {activeFeat.sections.map((section, i) => (
            <FeatSectionBlock key={section.name ?? i} section={section} />
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** Inline feat body for embedding in other dialogs (e.g. backgrounds). */
export function DndFeatInlineContent({ feat }: { feat: DndFeat }) {
  const categoryLabel = feat.category
    ? DND_FEAT_CATEGORY_LABELS[feat.category] ?? feat.category
    : undefined;

  return (
    <div className="rounded-md border border-sky-800/30 bg-sky-950/10 px-3 py-3 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-foreground">{feat.name}</p>
        {feat.isOriginFeat && (
          <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/50 text-[10px]">
            Origin Feat
          </Badge>
        )}
        {categoryLabel && !feat.isOriginFeat && (
          <Badge variant="outline" className="text-[10px]">
            {categoryLabel}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {feat.source}
          {feat.page !== undefined ? ` p.${feat.page}` : ""}
        </span>
      </div>

      {(feat.prerequisites.length > 0 || feat.abilityIncreases.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {feat.prerequisites.map((p) => (
            <span
              key={p}
              className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] text-foreground"
            >
              {p}
            </span>
          ))}
          {feat.abilityIncreases.map((a) => (
            <span
              key={a.label}
              className="rounded border border-emerald-800/40 bg-emerald-950/30 px-1.5 py-0.5 text-[10px] text-emerald-400"
            >
              {a.label}
            </span>
          ))}
        </div>
      )}

      <FeatParagraphList lines={feat.paragraphs} />
      {feat.sections.map((section, i) => (
        <FeatSectionBlock key={section.name ?? i} section={section} />
      ))}
    </div>
  );
}
