import { useEffect, useMemo, useState } from "react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { getTier } from "@/shared/utils/cr.utils";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { SourceBadge } from "@/features/spells/components/SourceBadge";
import { enrichCreatureWithLegendary } from "../services/bestiary.service";
import {
  formatFieldValue,
  getFieldsDifferentFromVariant,
  getFieldsThatVaryAcrossVariants,
  getVariantFieldLabel,
  sortCreatureVariants,
  type BestiaryVariantField,
} from "../utils/bestiary-variant.utils";
import { BestiaryStatBlock } from "./BestiaryStatBlock";

type DetailTab = "statblock" | "lair";

interface BestiaryDetailDialogProps {
  creature: BestiaryCreature | null;
  variants?: BestiaryCreature[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetaRow({
  label,
  value,
  differs,
}: {
  label: string;
  value: string;
  differs?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-sm",
          differs ? "text-amber-300 font-medium" : "text-foreground",
        )}
      >
        {value}
        {differs && (
          <span className="ml-1.5 text-[10px] font-normal text-amber-500/80">
            (varies)
          </span>
        )}
      </span>
    </div>
  );
}

function LairRegionalSection({ creature }: { creature: BestiaryCreature }) {
  const group = creature.legendaryGroup;
  if (!group) return null;

  return (
    <div className="space-y-4">
      {group.lairActions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-amber-800/50 pb-1 mb-2">
            Lair Actions
          </h3>
          {group.lairActions.map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground mb-2">
              {line}
            </p>
          ))}
        </div>
      )}
      {group.regionalEffects.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-amber-800/50 pb-1 mb-2">
            Regional Effects
          </h3>
          {group.regionalEffects.map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground mb-2">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function BestiaryDetailDialog({
  creature,
  variants = [],
  open,
  onOpenChange,
}: BestiaryDetailDialogProps) {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<BestiaryCreature | null>(null);
  const [tab, setTab] = useState<DetailTab>("statblock");
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});

  const sortedVariants = useMemo(
    () => sortCreatureVariants(variants.length > 0 ? variants : creature ? [creature] : []),
    [variants, creature],
  );

  const active = useMemo(() => {
    if (!creature) return null;
    if (activeSource) {
      return sortedVariants.find((v) => v.source === activeSource) ?? creature;
    }
    return sortedVariants.find((v) => v.source === creature.source) ?? creature;
  }, [creature, activeSource, sortedVariants]);

  const varyingFields = useMemo(
    () => getFieldsThatVaryAcrossVariants(sortedVariants),
    [sortedVariants],
  );

  const displayCreature = useMemo(() => {
    if (!active) return null;
    if (enriched?.id === active.id) return enriched;
    return active;
  }, [active, enriched]);

  const hasLairContent = !!displayCreature?.legendaryGroup;

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveSource(null);
      setTab("statblock");
    }
  }, [open]);

  useEffect(() => {
    setActiveSource(null);
    setEnriched(null);
  }, [creature?.id]);

  useEffect(() => {
    if (!active) {
      setEnriched(null);
      return;
    }

    const activeId = active.id;
    let cancelled = false;

    void enrichCreatureWithLegendary(active).then((result) => {
      if (!cancelled && result.id === activeId) {
        setEnriched(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!hasLairContent && tab === "lair") {
      setTab("statblock");
    }
  }, [hasLairContent, tab]);

  if (!creature || !active || !displayCreature) return null;

  const tier = getTier(active.cr);
  const canonical = sortedVariants[0];
  const diffFields =
    canonical && active.source !== canonical.source
      ? getFieldsDifferentFromVariant(active, canonical)
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="shrink-0 pb-3">
          <DialogTitle className="text-amber-400 text-2xl">{active.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">CR {active.crDisplay}</Badge>
              <Badge variant="secondary">Tier {tier}</Badge>
              <Badge variant="outline" className="capitalize">
                {active.type.type}
              </Badge>
              <SourceBadge source={active.source} bookNames={bookNames} />
              <span className="text-xs text-muted-foreground">
                {resolveBookSourceName(bookNames, active.source)} p.{active.page ?? "—"}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 space-y-3 px-6 pb-3 border-b border-border">
          {sortedVariants.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {sortedVariants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveSource(v.source)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    v.source === active.source
                      ? "border-amber-500 bg-amber-500/20 text-amber-400"
                      : "border-border bg-card text-muted-foreground hover:bg-accent",
                  )}
                >
                  {v.source}
                </button>
              ))}
            </div>
          )}

          {varyingFields.length > 0 && sortedVariants.length > 1 && (
            <div className="rounded-md border border-amber-800/30 bg-amber-950/10 px-3 py-2 text-xs text-muted-foreground">
              Fields that vary across sources:{" "}
              {varyingFields.map(getVariantFieldLabel).join(", ")}
            </div>
          )}

          {hasLairContent && (
            <div className="flex gap-1 -mb-px">
              <button
                type="button"
                onClick={() => setTab("statblock")}
                className={cn(
                  "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                  tab === "statblock"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Stat Block
              </button>
              <button
                type="button"
                onClick={() => setTab("lair")}
                className={cn(
                  "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                  tab === "lair"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Lair & Regional
              </button>
            </div>
          )}
        </div>

        <DialogBody className="flex-1 min-h-0 max-h-none overflow-y-auto pt-4">
          {tab === "statblock" && (
            <>
              {diffFields.length > 0 && (
                <div className="mb-4 space-y-1 rounded-md border border-border p-3">
                  {(["cr", "size", "type", "hp"] as BestiaryVariantField[])
                    .filter((f) => varyingFields.includes(f))
                    .map((field) => (
                      <MetaRow
                        key={field}
                        label={getVariantFieldLabel(field)}
                        value={formatFieldValue(active, field)}
                        differs={diffFields.includes(field)}
                      />
                    ))}
                </div>
              )}
              <BestiaryStatBlock creature={displayCreature} />
            </>
          )}

          {tab === "lair" && hasLairContent && (
            <LairRegionalSection creature={displayCreature} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
