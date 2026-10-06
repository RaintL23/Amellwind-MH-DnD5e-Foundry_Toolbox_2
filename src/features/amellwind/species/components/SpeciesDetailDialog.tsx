import { useEffect, useMemo, useState } from "react";
import { Species, SPECIES_CATEGORY_LABELS } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SpeciesContent } from "@/shared/components/species/SpeciesContent";
import { resolveSpeciesDisplayStats } from "@/shared/utils/species-display.utils";
import { getSubracesOf } from "../services/species.service";

interface SpeciesDetailDialogProps {
  species: Species | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a subspecies when opening from a deep link / search. */
  initialSubspeciesId?: string | null;
}

export function SpeciesDetailDialog({
  species,
  open,
  onOpenChange,
  initialSubspeciesId = null,
}: SpeciesDetailDialogProps) {
  const [subspecies, setSubspecies] = useState<Species[]>([]);
  const [activeSubspeciesId, setActiveSubspeciesId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open || !species) {
      setSubspecies([]);
      setActiveSubspeciesId(null);
      return;
    }

    // Standalone / orphan entries have no local base to switch against.
    if (species.isSubrace) {
      setSubspecies([]);
      setActiveSubspeciesId(null);
      return;
    }

    let cancelled = false;
    setActiveSubspeciesId(initialSubspeciesId);

    void getSubracesOf(species.name).then((list) => {
      if (cancelled) return;
      setSubspecies(list);
      if (
        initialSubspeciesId &&
        !list.some((item) => item.id === initialSubspeciesId)
      ) {
        setActiveSubspeciesId(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, species, initialSubspeciesId]);

  const activeSubspecies = useMemo(() => {
    if (!activeSubspeciesId) return null;
    return subspecies.find((item) => item.id === activeSubspeciesId) ?? null;
  }, [activeSubspeciesId, subspecies]);

  const [activeLegacyId, setActiveLegacyId] = useState<string | null>(null);

  useEffect(() => {
    setActiveLegacyId(null);
  }, [species?.id, activeSubspeciesId]);

  if (!species) return null;

  const displayName = activeSubspecies
    ? `${species.name} (${activeSubspecies.name})`
    : species.name;
  const stats = resolveSpeciesDisplayStats(species, activeSubspecies);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 text-2xl">
            {displayName}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {SPECIES_CATEGORY_LABELS[
                  activeSubspecies?.category ?? species.category
                ]}
              </Badge>
              {species.isSubrace && species.parentSpecies && (
                <Badge variant="outline">
                  {species.parentSpecies}
                  {species.parentSource ? ` (${species.parentSource})` : ""}
                </Badge>
              )}
              {activeSubspecies && (
                <Badge variant="outline" className="text-sky-300">
                  Subspecies
                </Badge>
              )}
              <Badge variant="outline">{stats.sizes.join(", ")}</Badge>
              <Badge variant="outline">{stats.speed}</Badge>
              <span className="text-xs text-muted-foreground">
                {(activeSubspecies ?? species).source}
                {(activeSubspecies ?? species).page !== undefined
                  ? ` p.${(activeSubspecies ?? species).page}`
                  : ""}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <SpeciesContent
            species={species}
            subspecies={activeSubspecies}
            subspeciesOptions={subspecies.map((item) => ({
              id: item.id,
              name: item.name,
            }))}
            activeSubspeciesId={activeSubspeciesId}
            onSubspeciesSelect={setActiveSubspeciesId}
            activeLegacyId={activeLegacyId}
            onLegacySelect={setActiveLegacyId}
            density="comfortable"
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
