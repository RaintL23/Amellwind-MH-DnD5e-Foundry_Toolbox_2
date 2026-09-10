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
import { Separator } from "@/components/ui/separator";
import { DndRichText } from "@/shared/components/DndRichText";
import { DndMarkupTable } from "@/shared/components/DndMarkupTable";
import { NamedVariantSwitcher } from "@/features/raintdm/builder/components/shared/NamedVariantSwitcher";
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

  if (!species) return null;

  const displayName = activeSubspecies
    ? `${species.name} (${activeSubspecies.name})`
    : species.name;

  const abilityBase =
    species.abilitySummary && species.abilitySummary !== "—"
      ? species.abilitySummary
      : null;
  const abilitySub =
    activeSubspecies?.abilitySummary &&
    activeSubspecies.abilitySummary !== "—"
      ? activeSubspecies.abilitySummary
      : null;

  const sizes =
    activeSubspecies && activeSubspecies.sizes.length > 0
      ? activeSubspecies.sizes
      : species.sizes;
  const speed =
    activeSubspecies && activeSubspecies.speed
      ? activeSubspecies.speed
      : species.speed;
  const darkvision =
    activeSubspecies?.darkvision ?? species.darkvision;
  const resistances = [
    ...new Set([
      ...species.resistances,
      ...(activeSubspecies?.resistances ?? []),
    ]),
  ];
  const resistanceSummary =
    activeSubspecies?.resistanceSummary || species.resistanceSummary;
  const traitTags = [
    ...new Set([
      ...species.traitTags,
      ...(activeSubspecies?.traitTags ?? []),
    ]),
  ];

  const subspeciesOptions = subspecies.map((item) => ({
    id: item.id,
    name: item.name,
  }));

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
              <Badge variant="outline">{sizes.join(", ")}</Badge>
              <Badge variant="outline">{speed}</Badge>
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
          {subspeciesOptions.length > 0 && (
            <NamedVariantSwitcher
              label="Subspecies"
              options={subspeciesOptions}
              activeId={activeSubspeciesId}
              onSelect={setActiveSubspeciesId}
              accent="sky"
              includeBaseOption
              baseLabel="Base"
              className="mb-4"
            />
          )}

          {species.fluff && (
            <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-emerald-800/40 pl-3 whitespace-pre-line">
              {species.fluff}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
            {(abilityBase || abilitySub) && (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Ability Bonuses
                </p>
                <p className="font-medium">
                  {abilityBase && (
                    <span className="text-foreground">{abilityBase}</span>
                  )}
                  {abilityBase && abilitySub && (
                    <span className="text-muted-foreground"> · </span>
                  )}
                  {abilitySub && (
                    <span className="text-sky-300">{abilitySub}</span>
                  )}
                </p>
              </div>
            )}
            {darkvision !== undefined && (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Darkvision
                </p>
                <p className="font-medium text-foreground">
                  {darkvision} ft.
                </p>
              </div>
            )}
            {(resistances.length > 0 || resistanceSummary) && (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Resistances
                </p>
                <p className="font-medium text-foreground capitalize">
                  {[...resistances, resistanceSummary]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            )}
          </div>

          {traitTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {traitTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            Species Traits
          </h3>
          <TraitBlock traits={species.traits} />

          {activeSubspecies &&
            (activeSubspecies.fluff || activeSubspecies.traits.length > 0) && (
              <>
                <Separator className="my-4" />
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3">
                  Subspecies — {activeSubspecies.name}
                </h3>
                {activeSubspecies.fluff && (
                  <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed border-l-2 border-sky-800/40 pl-3 whitespace-pre-line">
                    {activeSubspecies.fluff}
                  </p>
                )}
                <TraitBlock
                  traits={activeSubspecies.traits}
                  nameClassName="text-sky-300"
                />
              </>
            )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function TraitBlock({
  traits,
  nameClassName = "text-foreground",
}: {
  traits: Species["traits"];
  nameClassName?: string;
}) {
  if (traits.length === 0) return null;

  return (
    <div className="space-y-4">
      {traits.map((trait) => (
        <div key={trait.name}>
          <h4 className={`text-sm font-semibold mb-1 ${nameClassName}`}>
            {trait.name}
          </h4>
          {trait.entries.map((paragraph, i) => (
            <p
              key={i}
              className="text-sm text-muted-foreground leading-relaxed mb-1"
            >
              <DndRichText text={paragraph} />
            </p>
          ))}
          {trait.tables?.map((table, i) => (
            <DndMarkupTable
              key={i}
              caption={table.caption}
              colLabels={table.colLabels}
              rows={table.rows}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
