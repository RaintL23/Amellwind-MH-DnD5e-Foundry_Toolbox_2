import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  PlayCharacterCompiled,
  PlaySessionState,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import { previewRest, summarizeRestRecovery } from "../utils/rest.utils";
import type { useSheetRoller } from "../hooks/useSheetRoller";

interface RestSheetProps {
  restKind: "short" | "long" | null;
  onOpenChange: (open: boolean) => void;
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  dispatch: (a: PlaySessionAction) => void;
  logRoll: ReturnType<typeof useSheetRoller>["logRoll"];
}

export function RestSheet({
  restKind,
  onOpenChange,
  compiled,
  session,
  dispatch,
  logRoll,
}: RestSheetProps) {
  const restPreview =
    restKind != null ? previewRest(compiled, session, restKind) : null;

  const finishRest = (kind: "short" | "long") => {
    const summary = summarizeRestRecovery(compiled, session, kind);
    dispatch({ type: kind === "short" ? "SHORT_REST" : "LONG_REST" });
    logRoll({
      label: summary.label,
      expression: "—",
      total: summary.total,
      detail: summary.detail,
      mode: "normal",
    });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={restKind != null}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <SheetContent className="md:inset-x-auto md:left-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:rounded-t-xl">
        <SheetHeader>
          <SheetTitle>
            {restKind === "short" ? "Short Rest" : "Long Rest"}
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          {restKind === "short" ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Spend Hit Dice to heal. Recovers SR features, resources, and
                pact slots.
              </p>
              {compiled.hitDice.map((hd) => {
                const spent = session.hitDiceSpent[hd.die] ?? 0;
                const left = hd.max - spent;
                return (
                  <div
                    key={hd.die}
                    className="flex items-center justify-between rounded border border-border px-3 py-2"
                  >
                    <span className="text-sm">
                      {hd.die} ({left}/{hd.max} left)
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-9"
                      disabled={left <= 0}
                      onClick={() =>
                        dispatch({ type: "SPEND_HIT_DIE", dieKey: hd.die })
                      }
                    >
                      Spend
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                className="h-11 w-full"
                onClick={() => finishRest("short")}
              >
                Finish Short Rest
              </Button>
            </div>
          ) : restKind === "long" ? (
            <div className="space-y-2 text-sm">
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                <li>HP to maximum, clear temp HP</li>
                <li>Restore spell slots</li>
                <li>
                  Recover Hit Dice (
                  {compiled.rulesEdition === "2024"
                    ? "all"
                    : "half of total, min 1"}
                  )
                </li>
                <li>Restore LR/SR/day features & resources</li>
                <li>Exhaustion −1</li>
                {restPreview ? (
                  <li>
                    {restPreview.restoreFeatureIds.length} features,{" "}
                    {restPreview.restoreResourceIds.length} resources
                  </li>
                ) : null}
              </ul>
              <Button
                type="button"
                className="h-11 w-full"
                onClick={() => finishRest("long")}
              >
                Confirm Long Rest
              </Button>
            </div>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
