import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Swords } from "lucide-react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { getTier } from "@/shared/utils/cr.utils";
import {
  getBookSourceNames,
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/dnd/spells/services/book-source.service";
import { SourceBadge } from "@/features/dnd/spells/components/SourceBadge";
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
  const navigate = useNavigate();
  const location = useLocation();
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

  function handleBack() {
    if (location.key === "default") {
      navigate("/bestiary");
      return;
    }
    navigate(-1);
  }

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

  const statBlockBody = (
    <>
      {diffFields.length > 0 && (
        <div className="mb-4 space-y-2 rounded-md border border-border p-3">
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
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6 md:py-5">
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-amber-400 md:mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bestiary
        </button>

        <div className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Swords className="mt-1 h-6 w-6 shrink-0 text-amber-400" />
              <h1 className="min-w-0 flex-1 break-words text-xl font-bold text-amber-400 md:text-2xl">
                {active.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
            </div>

            {sortedVariants.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Sources:
                </p>
                <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
                  {sortedVariants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveSource(v.source)}
                      className={cn(
                        "h-8 shrink-0 rounded-md border px-3 text-xs font-medium transition-colors",
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
            )}
          </div>

          {varyingFields.length > 0 && sortedVariants.length > 1 && (
            <div className="rounded-md border border-amber-800/30 bg-amber-950/10 px-3 py-2 text-xs text-muted-foreground">
              <span className="block sm:inline">
                Fields that vary across sources:
              </span>{" "}
              <span className="break-words">
                {varyingFields.map(getVariantFieldLabel).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {hasLairContent ? (
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as DetailTab)}
              className="w-full"
            >
              <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm md:-mx-6 md:px-6">
                <TabsList className="grid h-10 w-full grid-cols-2">
                  <TabsTrigger value="statblock" className="text-xs sm:text-sm">
                    Stat Block
                  </TabsTrigger>
                  <TabsTrigger value="lair" className="text-xs sm:text-sm">
                    Lair &amp; Regional
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="statblock" className="mt-3">
                {statBlockBody}
              </TabsContent>
              <TabsContent value="lair" className="mt-3">
                <LairRegionalSection creature={displayCreature} />
              </TabsContent>
            </Tabs>
          ) : (
            statBlockBody
          )}
        </div>
      </div>
    </div>
  );
}
