import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  PlayConditionInstance,
  PlaySessionState,
  RulesEdition,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import {
  lookupConditionEffects,
  exhaustionLevelSummary,
} from "../utils/condition-effects.data";
import { Badge } from "@/components/ui/badge";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import { HintTooltip } from "@/shared/components/HintTooltip";
import {
  CatalogPickerGrid,
  CatalogPickerTile,
} from "./CatalogPickerGrid";
import type { ConfirmDialogFn } from "../hooks/useConfirmDialog";
import {
  catalogEntryDescription,
  loadStatusCatalog,
  type StatusCatalogEntry,
} from "../utils/status-catalog";

interface StatusChipsProps {
  session: PlaySessionState;
  edition: RulesEdition;
  onOpenStatus: () => void;
  confirm: ConfirmDialogFn;
  dispatch: (a: PlaySessionAction) => void;
}

/** Compact header chips: conditions, exhaustion, concentration. */
export function StatusChips({
  session,
  edition,
  onOpenStatus,
  confirm,
  dispatch,
}: StatusChipsProps) {
  const [descriptions, setDescriptions] = useState<Map<string, string>>(
    () => new Map(),
  );
  const exhaustionSummary = exhaustionLevelSummary(session.exhaustion, edition);
  const hasAnything =
    session.conditions.length > 0 ||
    session.exhaustion > 0 ||
    Boolean(session.concentration);

  useEffect(() => {
    let cancelled = false;
    void loadStatusCatalog().then((entries) => {
      if (cancelled) return;
      const next = new Map<string, string>();
      for (const entry of entries) {
        const text = catalogEntryDescription(entry);
        if (!text) continue;
        next.set(entry.id, text);
        next.set(entry.name.toLowerCase(), text);
      }
      setDescriptions(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tipFor = (c: PlayConditionInstance): string => {
    const fromCatalog =
      (c.refId ? descriptions.get(c.refId) : undefined) ??
      descriptions.get(c.name.toLowerCase());
    return fromCatalog ?? c.summary ?? "Open Status to manage";
  };

  const clearConcentration = async () => {
    if (!session.concentration) return;
    const ok = await confirm({
      title: "Clear concentration?",
      description: `Stop concentrating on ${session.concentration}?`,
      confirmLabel: "Clear",
    });
    if (!ok) return;
    dispatch({ type: "SET_CONCENTRATION", spellName: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 min-h-8"
        onClick={onOpenStatus}
      >
        Status
      </Button>
      {session.conditions.map((c) => (
        <HintTooltip
          key={c.id}
          content={tipFor(c)}
          className="max-w-sm text-left"
        >
          <span className="inline-flex">
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={onOpenStatus}
            >
              {c.name}
              {c.level != null ? ` ${c.level}` : ""}
            </Badge>
          </span>
        </HintTooltip>
      ))}
      {session.exhaustion > 0 ? (
        <HintTooltip
          content={exhaustionSummary ?? "Exhaustion"}
          className="max-w-sm text-left"
        >
          <span className="inline-flex">
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={onOpenStatus}
            >
              Exhaustion {session.exhaustion}
            </Badge>
          </span>
        </HintTooltip>
      ) : null}
      {session.concentration ? (
        <HintTooltip content="Clear concentration">
          <span className="inline-flex">
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => void clearConcentration()}
            >
              Conc: {session.concentration} ×
            </Badge>
          </span>
        </HintTooltip>
      ) : null}
      {!hasAnything ? (
        <span className="text-xs text-muted-foreground">No conditions</span>
      ) : null}
    </div>
  );
}

interface StatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PlaySessionState;
  edition: RulesEdition;
  dispatch: (a: PlaySessionAction) => void;
  confirm: ConfirmDialogFn;
}

export function StatusSheet({
  open,
  onOpenChange,
  session,
  edition,
  dispatch,
  confirm,
}: StatusSheetProps) {
  const [catalog, setCatalog] = useState<StatusCatalogEntry[]>([]);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [detail, setDetail] = useState<StatusCatalogEntry | null>(null);
  /** Single sheet steps — never stack a second Radix dialog (pointer-events freeze). */
  const [view, setView] = useState<"main" | "picker" | "detail">("main");

  useEffect(() => {
    if (!open) return;
    void loadStatusCatalog().then(setCatalog);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setView("main");
      setQ("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const query = deferredQ.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((c) => c.name.toLowerCase().includes(query));
  }, [catalog, deferredQ]);

  const entriesByTab = useMemo(() => {
    const build = (tab: "condition" | "status" | "disease" | "amellwind") =>
      filtered
        .filter((e) => {
          if (tab === "amellwind") return e.source === "amellwind";
          if (tab === "disease")
            return e.kind === "disease" && e.source === "dnd";
          return e.kind === tab && e.source === "dnd";
        })
        .slice(0, 80);
    return {
      condition: build("condition"),
      status: build("status"),
      disease: build("disease"),
      amellwind: build("amellwind"),
    };
  }, [filtered]);

  const apply = async (entry: StatusCatalogEntry) => {
    const nameKey = entry.name.toLowerCase();
    if (nameKey === "exhaustion" || nameKey === "exhausted") {
      dispatch({
        type: "SET_EXHAUSTION",
        level: Math.min(6, Math.max(1, session.exhaustion + 1)),
      });
      setDetail(null);
      setView("main");
      return;
    }

    const effects = lookupConditionEffects(entry.name);
    const description = catalogEntryDescription(entry);
    const inst: PlayConditionInstance = {
      id: crypto.randomUUID(),
      kind: entry.kind,
      source: entry.source,
      refId: entry.id,
      name: entry.name,
      summary: description || undefined,
      effectOverride: effects ?? undefined,
    };
    if (effects?.denyConcentration && session.concentration) {
      const ok = await confirm({
        title: "Break concentration?",
        description: `Applying ${entry.name} breaks concentration on ${session.concentration}.`,
        confirmLabel: "Apply",
      });
      if (!ok) return;
      dispatch({ type: "SET_CONCENTRATION", spellName: null });
    }
    dispatch({ type: "ADD_CONDITION", condition: inst });
    setDetail(null);
    setView("main");
  };

  const clearConcentration = async () => {
    if (!session.concentration) return;
    const ok = await confirm({
      title: "Clear concentration?",
      description: `Stop concentrating on ${session.concentration}?`,
      confirmLabel: "Clear",
    });
    if (!ok) return;
    dispatch({ type: "SET_CONCENTRATION", spellName: null });
  };

  const exhaustionSummary = exhaustionLevelSummary(session.exhaustion, edition);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] md:inset-x-auto md:left-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2"
      >
        {view === "detail" && detail ? (
          <>
            <SheetHeader>
              <SheetTitle>{detail.name}</SheetTitle>
              {lookupConditionEffects(detail.name) ? (
                <p className="text-[11px] text-primary">Has sheet effects</p>
              ) : null}
            </SheetHeader>
            <SheetBody>
              {detail.content.length > 0 ? (
                <StatBlockContentView content={detail.content} />
              ) : detail.summary ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {detail.summary}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No description available.
                </p>
              )}
            </SheetBody>
            <div className="flex shrink-0 gap-2 border-t border-border p-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => {
                  setDetail(null);
                  setView("picker");
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                className="h-11 flex-1"
                onClick={() => void apply(detail)}
              >
                Add
              </Button>
            </div>
          </>
        ) : view === "picker" ? (
          <>
            <SheetHeader>
              <SheetTitle>Add condition</SheetTitle>
            </SheetHeader>
            <SheetBody className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDetail(null);
                  setView("main");
                }}
              >
                ← Back
              </Button>
              <Input
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
              <Tabs defaultValue="condition">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
                  <TabsTrigger value="condition">Conditions</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="disease">Diseases</TabsTrigger>
                  <TabsTrigger value="amellwind">Amellwind</TabsTrigger>
                </TabsList>
                {(
                  ["condition", "status", "disease", "amellwind"] as const
                ).map((tab) => {
                  const entries = entriesByTab[tab];
                  return (
                    <TabsContent key={tab} value={tab} className="mt-3">
                      <CatalogPickerGrid>
                        {entries.map((e) => {
                          const hasEffects = Boolean(
                            lookupConditionEffects(e.name),
                          );
                          return (
                            <CatalogPickerTile
                              key={`${e.source}-${e.id}`}
                              title={e.name}
                              subtitle={
                                hasEffects
                                  ? "Sheet effects"
                                  : e.summary ?? null
                              }
                              className={
                                hasEffects
                                  ? "[&_span:last-child]:text-primary"
                                  : undefined
                              }
                              onClick={() => {
                                setDetail(e);
                                setView("detail");
                              }}
                            />
                          );
                        })}
                        {entries.length === 0 ? (
                          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                            No matches
                          </p>
                        ) : null}
                      </CatalogPickerGrid>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </SheetBody>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Status</SheetTitle>
            </SheetHeader>
            <SheetBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Conditions</span>
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-9"
                    onClick={() => setView("picker")}
                  >
                    + Add
                  </Button>
                </div>
                {session.conditions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {session.conditions.map((c) => (
                      <Badge
                        key={c.id}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() =>
                          dispatch({ type: "REMOVE_CONDITION", id: c.id })
                        }
                      >
                        {c.name}
                        {c.level != null ? ` ${c.level}` : ""} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Exhaustion</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={() =>
                      dispatch({
                        type: "SET_EXHAUSTION",
                        level: session.exhaustion - 1,
                      })
                    }
                  >
                    −
                  </Button>
                  <span className="w-6 text-center font-semibold">
                    {session.exhaustion}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={() =>
                      dispatch({
                        type: "SET_EXHAUSTION",
                        level: session.exhaustion + 1,
                      })
                    }
                  >
                    +
                  </Button>
                </div>
                {exhaustionSummary ? (
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {exhaustionSummary}
                  </p>
                ) : null}
              </div>

              {session.concentration ? (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>
                    Concentrating on{" "}
                    <strong>{session.concentration}</strong>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void clearConcentration()}
                  >
                    Clear
                  </Button>
                </div>
              ) : null}
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
