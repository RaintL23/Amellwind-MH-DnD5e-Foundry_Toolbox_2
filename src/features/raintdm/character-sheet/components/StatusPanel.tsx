import { useEffect, useMemo, useState } from "react";
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
import {
  getListDndConditions,
  getListDndDiseases,
} from "@/features/dnd/conditions/services/dnd-condition.service";
import { getAllConditions } from "@/features/amellwind/conditions/services/condition.service";
import { getAllDiseases } from "@/features/amellwind/diseases/services/disease.service";
import type {
  PlayConditionInstance,
  PlayConditionKind,
  PlayConditionSource,
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
import type { StatBlockContent } from "@/shared/types/statblock-content.types";
import {
  CatalogPickerGrid,
  CatalogPickerTile,
} from "./CatalogPickerGrid";
import type { ConfirmDialogFn } from "../hooks/useConfirmDialog";
import { X } from "lucide-react";

interface CatalogEntry {
  id: string;
  name: string;
  summary?: string;
  content: StatBlockContent[];
  kind: PlayConditionKind;
  source: PlayConditionSource;
}

function dedupeByName(entries: CatalogEntry[]): CatalogEntry[] {
  const seen = new Map<string, CatalogEntry>();
  for (const entry of entries) {
    const key = `${entry.source}|${entry.kind}|${entry.name.toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, entry);
  }
  return Array.from(seen.values());
}

interface StatusChipsProps {
  session: PlaySessionState;
  edition: RulesEdition;
  dispatch: (a: PlaySessionAction) => void;
  onOpenStatus: () => void;
}

/** Compact header chips: conditions, exhaustion, concentration. */
export function StatusChips({
  session,
  edition,
  dispatch,
  onOpenStatus,
}: StatusChipsProps) {
  const exhaustionSummary = exhaustionLevelSummary(session.exhaustion, edition);
  const hasAnything =
    session.conditions.length > 0 ||
    session.exhaustion > 0 ||
    Boolean(session.concentration);

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
        <Badge
          key={c.id}
          variant="secondary"
          className="cursor-pointer gap-1"
          onClick={() => dispatch({ type: "REMOVE_CONDITION", id: c.id })}
          title={c.summary ?? "Click to remove"}
        >
          {c.name}
          {c.level != null ? ` ${c.level}` : ""}
          <X className="h-3 w-3 opacity-60" />
        </Badge>
      ))}
      {session.exhaustion > 0 ? (
        <Badge
          variant="outline"
          className="cursor-pointer"
          title={exhaustionSummary ?? undefined}
          onClick={onOpenStatus}
        >
          Exhaustion {session.exhaustion}
        </Badge>
      ) : null}
      {session.concentration ? (
        <Badge
          variant="secondary"
          className="cursor-pointer gap-1"
          onClick={() =>
            dispatch({ type: "SET_CONCENTRATION", spellName: null })
          }
          title="Clear concentration"
        >
          Conc: {session.concentration}
          <X className="h-3 w-3 opacity-60" />
        </Badge>
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
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<CatalogEntry | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const [dndC, dndD, mhC, mhD] = await Promise.all([
        getListDndConditions().catch(() => []),
        getListDndDiseases().catch(() => []),
        getAllConditions().catch(() => []),
        getAllDiseases().catch(() => []),
      ]);
      const entries: CatalogEntry[] = [
        ...dndC.map((c) => ({
          id: c.id,
          name: c.name,
          summary: c.summary,
          content: c.content,
          kind: (c.category === "status"
            ? "status"
            : "condition") as PlayConditionKind,
          source: "dnd" as const,
        })),
        ...dndD.map((d) => ({
          id: d.id,
          name: d.name,
          summary: d.summary,
          content: d.content,
          kind: "disease" as const,
          source: "dnd" as const,
        })),
        ...mhC.map((c) => ({
          id: c.id,
          name: c.name,
          summary: c.summary,
          content: c.content,
          kind: "condition" as const,
          source: "amellwind" as const,
        })),
        ...mhD.map((d) => ({
          id: d.id,
          name: d.name,
          summary: d.summary,
          content: d.content,
          kind: "disease" as const,
          source: "amellwind" as const,
        })),
      ];
      setCatalog(dedupeByName(entries));
    })();
  }, []);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setPickerOpen(false);
      setQ("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((c) => c.name.toLowerCase().includes(query));
  }, [catalog, q]);

  const apply = async (entry: CatalogEntry) => {
    const effects = lookupConditionEffects(entry.name);
    const inst: PlayConditionInstance = {
      id: crypto.randomUUID(),
      kind: entry.kind,
      source: entry.source,
      refId: entry.id,
      name: entry.name,
      summary: entry.summary,
      level:
        entry.name.toLowerCase() === "exhaustion"
          ? Math.max(1, session.exhaustion || 1)
          : undefined,
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
    if (entry.name.toLowerCase() === "exhaustion") {
      dispatch({
        type: "SET_EXHAUSTION",
        level: Math.max(1, session.exhaustion || 1),
      });
    }
    setDetail(null);
    setPickerOpen(false);
  };

  const exhaustionSummary = exhaustionLevelSummary(session.exhaustion, edition);

  const tabEntries = (tab: "condition" | "status" | "disease" | "amellwind") =>
    filtered
      .filter((e) => {
        if (tab === "amellwind") return e.source === "amellwind";
        if (tab === "disease") return e.kind === "disease" && e.source === "dnd";
        return e.kind === tab && e.source === "dnd";
      })
      .slice(0, 80);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] md:inset-x-auto md:left-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2"
        >
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
                  onClick={() => setPickerOpen(true)}
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
                  onClick={() =>
                    dispatch({ type: "SET_CONCENTRATION", spellName: null })
                  }
                >
                  Clear
                </Button>
              </div>
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh]">
          {detail ? (
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
                  onClick={() => setDetail(null)}
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
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Add condition</SheetTitle>
              </SheetHeader>
              <SheetBody className="space-y-3">
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
                  ).map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-3">
                      <CatalogPickerGrid>
                        {tabEntries(tab).map((e) => {
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
                              onClick={() => setDetail(e)}
                            />
                          );
                        })}
                        {tabEntries(tab).length === 0 ? (
                          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                            No matches
                          </p>
                        ) : null}
                      </CatalogPickerGrid>
                    </TabsContent>
                  ))}
                </Tabs>
              </SheetBody>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
