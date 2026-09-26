import { memo, useDeferredValue, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { ActionLocks } from "../utils/condition-effects.data";
import type {
  PlayCharacterCompiled,
  PlaySessionState,
  PlaySpell,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import type { useSheetRoller } from "../hooks/useSheetRoller";
import type { ConfirmDialogFn } from "../hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { spellHasAttackRoll } from "../utils/spell-attack.utils";
import {
  availableUpcastLevels,
  canSpendSlotForSpell,
  castPlaySpell,
  isSpellReady,
  spellEconomyLocked,
} from "../utils/cast-spell.utils";
import {
  spellLevelLabel,
  toDescriptionLines,
} from "../utils/description-lines.utils";
import { DescriptionLines } from "@/shared/components/DescriptionLines";
import { UsesPips } from "./UsesPips";

interface SpellsPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  locks: ActionLocks;
  dispatch: (a: PlaySessionAction) => void;
  rollD20Test: ReturnType<typeof useSheetRoller>["rollD20Test"];
  logRoll: ReturnType<typeof useSheetRoller>["logRoll"];
  confirm: ConfirmDialogFn;
}

const SpellDescription = memo(function SpellDescription({
  description,
}: {
  description: string;
}) {
  const lines = useMemo(
    () => toDescriptionLines(description),
    [description],
  );
  return <DescriptionLines lines={lines} sizeClass="text-xs" />;
});

export function SpellsPanel({
  compiled,
  session,
  locks,
  dispatch,
  rollD20Test,
  logRoll,
  confirm,
}: SpellsPanelProps) {
  const sc = compiled.spellcasting;
  const castingRef = useRef(false);
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [preparedOnly, setPreparedOnly] = useState(false);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  const spells = useMemo(() => {
    if (!sc) return [];
    const query = deferredQ.trim().toLowerCase();
    return sc.spells.filter((s) => {
      if (levelFilter !== "all" && s.level !== levelFilter) return false;
      if (preparedOnly) {
        if (!isSpellReady(s, session, sc)) return false;
      }
      if (
        query &&
        !s.name.toLowerCase().includes(query) &&
        !(s.description?.toLowerCase().includes(query) ?? false)
      ) {
        return false;
      }
      return true;
    });
  }, [sc, levelFilter, preparedOnly, session, deferredQ]);

  const byLevel = useMemo(() => {
    const map = new Map<number, PlaySpell[]>();
    for (const s of spells) {
      const arr = map.get(s.level) ?? [];
      arr.push(s);
      map.set(s.level, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [spells]);

  if (!sc) {
    return (
      <p className="text-sm text-muted-foreground">
        This character has no spellcasting.
      </p>
    );
  }

  const runCast = async (
    spell: PlaySpell,
    slotLevel: number,
    asRitual = false,
  ) => {
    if (castingRef.current) return;
    castingRef.current = true;
    try {
      await castPlaySpell({
        spell,
        slotLevel,
        asRitual,
        sc,
        session,
        locks,
        dispatch,
        rollD20Test,
        logRoll,
        confirm,
        requirePrepared: true,
        characterLevel: compiled.level,
      });
    } finally {
      castingRef.current = false;
    }
  };

  const clearConcentration = async () => {
    const ok = await confirm({
      title: "End concentration?",
      description: `Stop concentrating on ${session.concentration}?`,
      confirmLabel: "End",
    });
    if (!ok) return;
    dispatch({ type: "SET_CONCENTRATION", spellName: null });
  };

  const levels = [
    0,
    ...Object.keys(sc.slotMax)
      .map(Number)
      .sort((a, b) => a - b),
  ];
  if (sc.pact) levels.push(sc.pact.level);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatBox label="Ability" value={sc.ability.toUpperCase() || "—"} />
        <StatBox label="Spell Atk" value={`+${sc.attackBonus}`} />
        <StatBox label="Save DC" value={String(sc.saveDc)} />
        {session.concentration ? (
          <Badge
            variant="secondary"
            className="h-auto cursor-pointer self-center px-2.5 py-2"
            onClick={() => void clearConcentration()}
          >
            Conc: {session.concentration} ×
          </Badge>
        ) : null}
      </div>

      <Card className="space-y-2 p-3 shadow-none">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Spell slots
        </h3>
        <div className="flex flex-wrap gap-3">
          {sc.isPactMagic && sc.pact ? (
            <div className="flex items-center gap-2">
              <span className="w-14 text-xs font-medium tabular-nums">
                Pact Level {sc.pact.level}{" "}
                <span className="text-muted-foreground">
                  {sc.pact.max - session.pactSpent}/{sc.pact.max}
                </span>
              </span>
              <UsesPips
                label={`Pact Level ${sc.pact.level}`}
                max={sc.pact.max}
                left={sc.pact.max - session.pactSpent}
                pipClassName="h-6 w-6 rounded-sm"
                onSetLeft={(newLeft) =>
                  dispatch({
                    type: "SET_PACT_SPENT",
                    spent: sc.pact!.max - newLeft,
                    max: sc.pact!.max,
                  })
                }
              />
            </div>
          ) : (
            Object.entries(sc.slotMax).map(([lvl, max]) => {
              const level = Number(lvl);
              const spent = session.slotsSpent[level] ?? 0;
              const left = max - spent;
              return (
                <div key={lvl} className="flex items-center gap-2">
                  <span className="w-14 text-xs font-medium tabular-nums">
                    Level {level}{" "}
                    <span className="text-muted-foreground">
                      {left}/{max}
                    </span>
                  </span>
                  <UsesPips
                    label={`Level ${level}`}
                    max={max}
                    left={left}
                    pipClassName="h-6 w-6 rounded-sm"
                    onSetLeft={(newLeft) =>
                      dispatch({
                        type: "SET_SLOTS_SPENT",
                        level,
                        spent: max - newLeft,
                        max,
                      })
                    }
                  />
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Input
        placeholder="Search spells…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          type="button"
          size="sm"
          className="min-h-9 shrink-0"
          variant={levelFilter === "all" ? "default" : "outline"}
          onClick={() => setLevelFilter("all")}
        >
          All
        </Button>
        {[...new Set(levels)].map((lv) => (
          <Button
            key={lv}
            type="button"
            size="sm"
            className="min-h-9 shrink-0"
            variant={levelFilter === lv ? "default" : "outline"}
            onClick={() => setLevelFilter(lv)}
          >
            {lv === 0 ? "Cantrips" : `Level ${lv}`}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          className="min-h-9 shrink-0"
          variant={preparedOnly ? "default" : "outline"}
          onClick={() => setPreparedOnly((v) => !v)}
        >
          Prepared
        </Button>
      </div>

      {byLevel.map(([level, list]) => (
        <section key={level} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {level === 0 ? "Cantrips" : `Level ${level}`}
            <span className="ml-1 font-normal">({list.length})</span>
          </h3>
          <Accordion type="multiple" className="space-y-2">
            {list.map((spell) => {
              const locked = spellEconomyLocked(spell, locks);
              const prepared = isSpellReady(spell, session, sc);
              const defaultSlot = sc.isPactMagic
                ? (sc.pact?.level ?? spell.level)
                : Math.max(spell.level, 1);
              const upcastLevels = availableUpcastLevels(spell, session, sc);
              const hasSlotForDefault = canSpendSlotForSpell(
                spell,
                session,
                sc,
                upcastLevels[0] ?? defaultSlot,
                false,
              );
              const noSlots =
                spell.level > 0 &&
                !spell.isRitual &&
                upcastLevels.length === 0;
              const castDisabled =
                locked ||
                !prepared ||
                noSlots ||
                (spell.level > 0 &&
                  !spell.isRitual &&
                  !hasSlotForDefault &&
                  upcastLevels.length <= 1);
              const castTitle = noSlots ? "No slots" : undefined;
              const isConcentrating =
                Boolean(session.concentration) &&
                session.concentration === spell.name;
              const activeEffects = isConcentrating
                ? (spell.statEffects ?? [])
                : [];
              const needsAttack = spellHasAttackRoll(spell);

              const deferCast = (
                slotLevel: number,
                asRitual = false,
              ) => {
                window.setTimeout(
                  () => void runCast(spell, slotLevel, asRitual),
                  0,
                );
              };

              return (
                <Card
                  key={spell.id}
                  className={cn(
                    "overflow-hidden shadow-none",
                    locked && "opacity-50",
                  )}
                >
                  <AccordionItem value={spell.id} className="border-0">
                    <AccordionTrigger className="gap-2 px-3 py-2.5 hover:no-underline">
                      <span className="flex min-w-0 flex-1 items-start justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium">{spell.name}</span>
                            {isConcentrating ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-normal"
                              >
                                Active · Concentrating
                              </Badge>
                            ) : null}
                            {activeEffects.map((e) => (
                              <Badge
                                key={`${e.kind}-${e.label}`}
                                variant="secondary"
                                className="text-[10px] font-normal"
                              >
                                Active · {e.label}
                              </Badge>
                            ))}
                          </span>
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {spell.castingTime}
                            {spell.range ? ` · ${spell.range}` : ""}
                            {spell.isConcentration ? " · C" : ""}
                            {spell.isRitual ? " · R" : ""}
                            {needsAttack ? " · Attack" : ""}
                          </span>
                        </span>
                        <span
                          className="flex shrink-0 gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {sc.isPreparedCaster && spell.level > 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              className="min-h-9"
                              variant={prepared ? "secondary" : "outline"}
                              onClick={() =>
                                dispatch({
                                  type: "TOGGLE_PREPARED",
                                  spellId: spell.id,
                                })
                              }
                            >
                              {prepared ? "Prep'd" : "Prep"}
                            </Button>
                          ) : null}
                          {spell.isRitual ? (
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="min-h-9 gap-1"
                                  disabled={locked || !prepared}
                                  title={castTitle}
                                >
                                  Cast
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {upcastLevels.length > 1 ? (
                                  upcastLevels.map((lv) => (
                                    <DropdownMenuItem
                                      key={lv}
                                      disabled={!canSpendSlotForSpell(
                                        spell,
                                        session,
                                        sc,
                                        lv,
                                        false,
                                      )}
                                      onSelect={() => deferCast(lv, false)}
                                    >
                                      {lv === spell.level
                                        ? `Cast with slot (${spellLevelLabel(lv)})`
                                        : `Upcast ${spellLevelLabel(lv)}`}
                                    </DropdownMenuItem>
                                  ))
                                ) : (
                                  <DropdownMenuItem
                                    disabled={
                                      upcastLevels.length === 0 ||
                                      !canSpendSlotForSpell(
                                        spell,
                                        session,
                                        sc,
                                        upcastLevels[0] ?? defaultSlot,
                                        false,
                                      )
                                    }
                                    onSelect={() =>
                                      deferCast(
                                        upcastLevels[0] ?? defaultSlot,
                                        false,
                                      )
                                    }
                                  >
                                    Cast with slot
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onSelect={() => deferCast(defaultSlot, true)}
                                >
                                  As ritual (no slot)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : upcastLevels.length > 1 ? (
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="min-h-9 gap-1"
                                  disabled={castDisabled}
                                  title={castTitle}
                                >
                                  Cast
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {upcastLevels.map((lv) => (
                                  <DropdownMenuItem
                                    key={lv}
                                    onSelect={() => deferCast(lv, false)}
                                  >
                                    {lv === spell.level
                                      ? `Cast (${spellLevelLabel(lv)})`
                                      : `Upcast ${spellLevelLabel(lv)}`}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="min-h-9"
                              disabled={castDisabled}
                              title={castTitle}
                              onClick={() =>
                                deferCast(
                                  upcastLevels[0] ?? defaultSlot,
                                  false,
                                )
                              }
                            >
                              Cast
                            </Button>
                          )}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 px-3 pb-3">
                      <p className="text-xs text-muted-foreground">
                        {spell.castingTime}
                        {spell.range ? ` · Range ${spell.range}` : ""}
                        {spell.duration ? ` · ${spell.duration}` : ""}
                        {spell.isConcentration ? " · Concentration" : ""}
                        {spell.isRitual ? " · Ritual" : ""}
                        {spell.school ? ` · ${spell.school}` : ""}
                      </p>
                      {spell.description ? (
                        <SpellDescription description={spell.description} />
                      ) : (
                        <p className="text-xs italic text-muted-foreground">
                          No description available for this spell.
                        </p>
                      )}
                      {spell.higherLevel ? (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            At Higher Levels
                          </p>
                          <SpellDescription description={spell.higherLevel} />
                        </div>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              );
            })}
          </Accordion>
        </section>
      ))}
      {spells.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matching spells.</p>
      ) : null}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center rounded-lg border border-border bg-card px-3 py-2 text-center">
      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
