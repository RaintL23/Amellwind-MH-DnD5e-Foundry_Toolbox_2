import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Swords } from "lucide-react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { getTier } from "@/shared/utils/cr.utils";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import { SourceBadge } from "@/features/spells/components/SourceBadge";
import {
  enrichCreatureWithLegendary,
  getBestiaryCreatureById,
  getCreaturesByName,
} from "../services/bestiary.service";
import {
  formatFieldValue,
  getFieldsDifferentFromVariant,
  getFieldsThatVaryAcrossVariants,
  getVariantFieldLabel,
  sortCreatureVariants,
  type BestiaryVariantField,
} from "../utils/bestiary-variant.utils";
import { BestiaryStatBlock } from "./BestiaryStatBlock";
import { BestiaryDetailLoading } from "./detail/BestiaryDetailLoading";
import { BestiaryDetailNotFound } from "./detail/BestiaryDetailNotFound";
import { LairRegionalSection, MetaRow } from "./detail/bestiary-detail.shared";

type DetailTab = "statblock" | "lair";

export function BestiaryDetailPage() {
  const { creatureId = "" } = useParams<{ creatureId: string }>();

  const [creature, setCreature] = useState<BestiaryCreature | null>(null);
  const [variants, setVariants] = useState<BestiaryCreature[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<BestiaryCreature | null>(null);
  const [tab, setTab] = useState<DetailTab>("statblock");
  const [bookNames, setBookNames] = useState<BookSourceNameMap>({});

  useEffect(() => {
    if (!creatureId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void (async () => {
      const found = await getBestiaryCreatureById(creatureId);
      if (cancelled) return;
      if (!found) {
        setCreature(null);
        setVariants([]);
        setNotFound(true);
        setLoading(false);
        return;
      }
      const group = await getCreaturesByName(found.name);
      if (cancelled) return;
      setCreature(found);
      setVariants(group);
      setActiveSource(null);
      setEnriched(null);
      setTab("statblock");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [creatureId]);

  useEffect(() => {
    void getBookSourceNames().then(setBookNames);
  }, []);

  const sortedVariants = useMemo(
    () =>
      sortCreatureVariants(
        variants.length > 0 ? variants : creature ? [creature] : [],
      ),
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

  if (loading) {
    return <BestiaryDetailLoading />;
  }

  if (notFound || !creature || !active || !displayCreature) {
    return <BestiaryDetailNotFound />;
  }

  const tier = getTier(active.cr);
  const canonical = sortedVariants[0];
  const diffFields =
    canonical && active.source !== canonical.source
      ? getFieldsDifferentFromVariant(active, canonical)
      : [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <Link
          to="/bestiary"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bestiary
        </Link>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Swords className="h-6 w-6 text-amber-400 shrink-0 mt-1" />
              <h1 className="min-w-0 flex-1 text-2xl font-bold text-amber-400">
                {active.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">CR {active.crDisplay}</Badge>
              <Badge variant="secondary">Tier {tier}</Badge>
              <Badge variant="outline" className="capitalize">
                {active.type.type}
              </Badge>
              <SourceBadge source={active.source} bookNames={bookNames} />
              <span className="text-xs text-muted-foreground">
                {resolveBookSourceName(bookNames, active.source)} p.
                {active.page ?? "—"}
              </span>
              {sortedVariants.length > 1 &&
                sortedVariants.map((v) => (
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
          </div>

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
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full min-w-[18rem] space-y-4 px-20">
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
        </div>
      </div>
    </div>
  );
}
