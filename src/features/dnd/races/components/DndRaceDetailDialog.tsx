import { useEffect, useMemo, useRef, useState } from "react";
import { SourceVariantSwitcher } from "@/shared/components/SourceVariantSwitcher";
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
import { SpeciesContent } from "@/shared/components/species/SpeciesContent";
import { resolveSpeciesDisplayStats } from "@/shared/utils/species-display.utils";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/dnd/spells/services/book-source.service";
import { getDndSubracesForParent } from "../services/dnd-race.service";

interface DndRaceDetailDialogProps {
  race: DndRace | null;
  variants?: DndRace[];
  /** Subrace (by name) to preselect the first time the parent's subraces load. */
  initialSubraceName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DndRaceDetailDialog({
  race: raceProp,
  variants: variantsProp,
  initialSubraceName,
  open,
  onOpenChange,
}: DndRaceDetailDialogProps) {
  const pendingSubraceName = useRef(initialSubraceName ?? null);
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

  const [subraces, setSubraces] = useState<DndRace[]>([]);
  const [activeSubraceId, setActiveSubraceId] = useState<string | null>(null);
  const [activeLegacyId, setActiveLegacyId] = useState<string | null>(null);

  useEffect(() => {
    setSubraces([]);
    setActiveSubraceId(null);
    setActiveLegacyId(null);
    if (!activeRace || activeRace.parentName) return;

    let cancelled = false;
    void getDndSubracesForParent(activeRace.name, activeRace.source).then(
      (list) => {
        if (cancelled) return;
        setSubraces(list);
        if (activeRace.id !== raceProp?.id) return;
        const wanted = pendingSubraceName.current;
        pendingSubraceName.current = null;
        const match = wanted ? list.find((s) => s.name === wanted) : undefined;
        if (match) setActiveSubraceId(match.id);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activeRace, raceProp?.id]);

  if (!activeRace) return null;

  const activeSubrace =
    subraces.find((subrace) => subrace.id === activeSubraceId) ?? null;
  const stats = resolveSpeciesDisplayStats(activeRace, activeSubrace);
  const sourceName = resolveBookSourceName(bookNames, activeRace.source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 text-2xl">
            {activeSubrace
              ? `${activeRace.name} (${activeSubrace.name})`
              : activeRace.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{DND_RACE_KIND_LABELS[activeRace.kind]}</Badge>
              {activeRace.parentName && (
                <Badge variant="outline">
                  {activeRace.parentName}
                  {activeRace.parentSource ? ` (${activeRace.parentSource})` : ""}
                </Badge>
              )}
              <Badge variant="outline">{stats.sizes.join(", ")}</Badge>
              <Badge variant="outline">{stats.speed}</Badge>
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
              <SourceVariantSwitcher
                size="md"
                accent="emerald"
                variants={variants}
                activeId={activeId}
                onSelect={setActiveId}
                bookNames={bookNames}
              />
              <Separator className="my-4" />
            </>
          )}

          <SpeciesContent
            species={activeRace}
            subspecies={activeSubrace}
            subspeciesOptions={subraces.map((subrace) => ({
              id: subrace.id,
              name: subrace.name,
            }))}
            activeSubspeciesId={activeSubraceId}
            onSubspeciesSelect={setActiveSubraceId}
            activeLegacyId={activeLegacyId}
            onLegacySelect={setActiveLegacyId}
            density="comfortable"
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
