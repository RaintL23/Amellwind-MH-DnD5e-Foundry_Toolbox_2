import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/shared/utils/cn";
import type { ActionLocks } from "../utils/condition-effects.data";
import type { PlaySessionState } from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import type { useSheetRoller } from "../hooks/useSheetRoller";

interface HpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PlaySessionState;
  locks: ActionLocks;
  dispatch: (a: PlaySessionAction) => void;
  rollD20Test: ReturnType<typeof useSheetRoller>["rollD20Test"];
}

export function HpSheet({
  open,
  onOpenChange,
  session,
  locks,
  dispatch,
  rollD20Test,
}: HpSheetProps) {
  const [amount, setAmount] = useState("5");
  const parsed = Math.max(0, parseInt(amount, 10) || 0);

  const applyDamage = () => {
    if (parsed <= 0) return;
    dispatch({ type: "SET_HP_DELTA", delta: -parsed });
  };
  const applyHeal = () => {
    if (parsed <= 0) return;
    dispatch({ type: "SET_HP_DELTA", delta: parsed });
  };
  const setTemp = () => {
    dispatch({
      type: "SET_TEMP_HP",
      temp: parsed,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="md:inset-x-auto md:left-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Hit Points</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <p className="text-3xl font-bold tabular-nums">
            {session.hp.current} / {session.hp.max}
            {session.hp.temp > 0 ? (
              <span className="text-lg text-sky-600 dark:text-sky-400">
                {" "}
                (+{session.hp.temp} temp)
              </span>
            ) : null}
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Amount
            </label>
            <Input
              inputMode="numeric"
              className="h-11 text-center text-lg tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-destructive text-destructive"
                onClick={applyDamage}
              >
                Damage
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11"
                onClick={applyHeal}
              >
                Heal
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={setTemp}
              >
                Set Temp
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[-10, -5, -1, 1, 5, 10].map((d) => (
              <Button
                key={d}
                type="button"
                variant={d < 0 ? "outline" : "secondary"}
                className={cn(
                  "min-h-10 min-w-12",
                  d < 0 && "border-destructive text-destructive",
                )}
                onClick={() => dispatch({ type: "SET_HP_DELTA", delta: d })}
              >
                {d > 0 ? `+${d}` : d}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() =>
                dispatch({
                  type: "SET_HP_ABSOLUTE",
                  current: session.hp.max,
                  temp: 0,
                })
              }
            >
              Full HP
            </Button>
          </div>

          {session.hp.current <= 0 ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Death Saves</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    dispatch({
                      type: "SET_DEATH_SAVES",
                      side: "successes",
                      count: 0,
                    });
                    dispatch({
                      type: "SET_DEATH_SAVES",
                      side: "failures",
                      count: 0,
                    });
                  }}
                >
                  Reset
                </Button>
              </div>
              <DeathPips
                label="Successes"
                count={session.deathSaves.successes}
                tone="success"
                onSet={(n) =>
                  dispatch({
                    type: "SET_DEATH_SAVES",
                    side: "successes",
                    count: n,
                  })
                }
              />
              <DeathPips
                label="Failures"
                count={session.deathSaves.failures}
                tone="fail"
                onSet={(n) =>
                  dispatch({
                    type: "SET_DEATH_SAVES",
                    side: "failures",
                    count: n,
                  })
                }
              />
              <Button
                type="button"
                className="h-11 w-full"
                onClick={() => {
                  void (async () => {
                    const result = await rollD20Test({
                      label: "Death Save",
                      modifier: 0,
                      kind: "death",
                      locks,
                    });
                    if (result.aborted) return;
                    dispatch({
                      type: "ROLL_DEATH_SAVE",
                      d20: result.natural ?? result.total,
                    });
                  })();
                }}
              >
                Roll Death Save
              </Button>
            </div>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function DeathPips({
  label,
  count,
  tone,
  onSet,
}: {
  label: string;
  count: number;
  tone: "success" | "fail";
  onSet: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-20 text-muted-foreground">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} ${n}`}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-colors",
              n <= count
                ? tone === "success"
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-destructive bg-destructive"
                : "border-muted-foreground/40",
            )}
            onClick={() => onSet(n === count ? n - 1 : n)}
          />
        ))}
      </div>
    </div>
  );
}
