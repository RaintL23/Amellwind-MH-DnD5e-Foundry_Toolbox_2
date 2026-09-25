import { useMemo, useState } from "react";
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

interface SpellsPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  locks: ActionLocks;
  dispatch: (a: PlaySessionAction) => void;
  rollD20Test: ReturnType<typeof useSheetRoller>["rollD20Test"];
  logRoll: ReturnType<typeof useSheetRoller>["logRoll"];
  confirm: ConfirmDialogFn;
}

function spellLocked(spell: PlaySpell, locks: ActionLocks): boolean {
  if (spell.bucket === "bonus") return locks.bonusActions;
  if (spell.bucket === "reaction") return locks.reactions;
  return locks.actions;
}

function availableUpcastLevels(
  spell: PlaySpell,
  session: PlaySessionState,
  slotMax: Record<number, number>,
  isPact: boolean,
  pact?: { max: number; level: number },
): number[] {
  if (spell.level === 0 || spell.isRitual) return [];
  if (isPact && pact) {
    if (session.pactSpent >= pact.max) return [];
    return [pact.level];
  }
  const levels: number[] = [];
  for (let lv = Math.max(spell.level, 1); lv <= 9; lv++) {
    const max = slotMax[lv] ?? 0;
    if (max <= 0) continue;
    const spent = session.slotsSpent[lv] ?? 0;
    if (spent < max) levels.push(lv);
  }
  return levels;
}

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
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [preparedOnly, setPreparedOnly] = useState(false);
  const [q, setQ] = useState("");

  const spells = useMemo(() => {
    if (!sc) return [];
    const query = q.trim().toLowerCase();
    return sc.spells.filter((s) => {
      if (levelFilter !== "all" && s.level !== levelFilter) return false;
      if (preparedOnly) {
        const prepared =
          s.alwaysPrepared ||
          s.level === 0 ||
          session.preparedSpellIds.includes(s.id);
        if (!prepared) return false;
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
  }, [sc, levelFilter, preparedOnly, session.preparedSpellIds, q]);

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

  const cast = async (spell: PlaySpell, slotLevel: number) => {
    if (spellLocked(spell, locks)) return;

    if (spell.isConcentration) {
      if (session.concentration && session.concentration !== spell.name) {
        const ok = await confirm({
          title: "Break concentration?",
          description: `Cast ${spell.name} and break concentration on ${session.concentration}?`,
          confirmLabel: "Cast",
        });
        if (!ok) return;
      }
    }

    if (spell.level > 0 && !spell.isRitual) {
      if (sc.isPactMagic && sc.pact) {
        if (session.pactSpent >= sc.pact.max) return;
        dispatch({ type: "SPEND_PACT", max: sc.pact.max });
      } else {
        const max = sc.slotMax[slotLevel] ?? 0;
        const spent = session.slotsSpent[slotLevel] ?? 0;
        if (spent >= max) return;
        dispatch({ type: "SPEND_SLOT", level: slotLevel, max });
      }
    }
    if (spell.isConcentration) {
      dispatch({ type: "SET_CONCENTRATION", spellName: spell.name });
    }

    const slotNote =
      spell.level === 0
        ? "Cantrip"
        : sc.isPactMagic
          ? `Pact Level ${slotLevel}`
          : `Level ${slotLevel} slot`;

    if (spellHasAttackRoll(spell)) {
      await rollD20Test({
        label: `Cast ${spell.name}`,
        modifier: sc.attackBonus,
        kind: "attack",
        locks,
      });
    } else {
      logRoll({
        label: `Cast ${spell.name}`,
        expression: "—",
        total: 0,
        detail: `${slotNote} · DC ${sc.saveDc}`,
        mode: "normal",
      });
    }
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
            onClick={() =>
              dispatch({ type: "SET_CONCENTRATION", spellName: null })
            }
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
          {sc.isPactMagic && sc.pact
            ? (() => {
                const left = sc.pact.max - session.pactSpent;
                return (
                  <SlotRow
                    label={`Pact Level ${sc.pact.level}`}
                    max={sc.pact.max}
                    left={left}
                    onToggle={(i) => {
                      // Filled = available: click sets remaining to i (spend) or i+1 (restore).
                      const newLeft = i < left ? i : i + 1;
                      const newSpent = sc.pact!.max - newLeft;
                      dispatch({ type: "CLEAR_PACT" });
                      for (let j = 0; j < newSpent; j++) {
                        dispatch({ type: "SPEND_PACT", max: sc.pact!.max });
                      }
                    }}
                  />
                );
              })()
            : Object.entries(sc.slotMax).map(([lvl, max]) => {
                const level = Number(lvl);
                const spent = session.slotsSpent[level] ?? 0;
                const left = max - spent;
                return (
                  <SlotRow
                    key={lvl}
                    label={`Level ${level}`}
                    max={max}
                    left={left}
                    onToggle={(i) => {
                      // Filled = available: click sets remaining to i (spend) or i+1 (restore).
                      const newLeft = i < left ? i : i + 1;
                      const newSpent = max - newLeft;
                      dispatch({ type: "CLEAR_SLOT", level });
                      for (let j = 0; j < newSpent; j++) {
                        dispatch({ type: "SPEND_SLOT", level, max });
                      }
                    }}
                  />
                );
              })}
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
              const locked = spellLocked(spell, locks);
              const prepared =
                spell.alwaysPrepared ||
                spell.level === 0 ||
                session.preparedSpellIds.includes(spell.id);
              const defaultSlot = sc.isPactMagic
                ? sc.pact?.level ?? spell.level
                : Math.max(spell.level, 1);
              const upcastLevels = availableUpcastLevels(
                spell,
                session,
                sc.slotMax,
                sc.isPactMagic,
                sc.pact,
              );
              const isConcentrating =
                Boolean(session.concentration) &&
                session.concentration === spell.name;
              const activeEffects = isConcentrating
                ? (spell.statEffects ?? [])
                : [];
              const needsAttack = spellHasAttackRoll(spell);

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
                          {upcastLevels.length > 1 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="min-h-9 gap-1"
                                  disabled={locked}
                                >
                                  Cast
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {upcastLevels.map((lv) => (
                                  <DropdownMenuItem
                                    key={lv}
                                    onClick={() => void cast(spell, lv)}
                                  >
                                    {lv === spell.level
                                      ? `Cast (L${lv})`
                                      : `Upcast L${lv}`}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="min-h-9"
                              disabled={locked}
                              onClick={() =>
                                void cast(
                                  spell,
                                  upcastLevels[0] ?? defaultSlot,
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
                        <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                          {spell.description}
                        </p>
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
                          <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                            {spell.higherLevel}
                          </p>
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

function SlotRow({
  label,
  max,
  left,
  onToggle,
}: {
  label: string;
  max: number;
  left: number;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-xs font-medium tabular-nums">
        {label}{" "}
        <span className="text-muted-foreground">
          {left}/{max}
        </span>
      </span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              "h-6 w-6 rounded-sm border",
              i < left
                ? "border-primary bg-primary"
                : "border-muted-foreground/40",
            )}
            aria-label={`${label} slot ${i + 1}`}
            onClick={() => onToggle(i)}
          />
        ))}
      </div>
    </div>
  );
}
