import { cn } from "@/shared/utils/cn";
import { Button } from "@/components/ui/button";
import type {
  PlayCharacterCompiled,
  PlayResource,
  PlaySessionState,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import { formatRecoveryLabel } from "../utils/rest.utils";

interface ResourcesPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  dispatch: (a: PlaySessionAction) => void;
  className?: string;
}

function spentForResource(
  r: PlayResource,
  session: PlaySessionState,
): number {
  if (r.featureId) return session.featureUsesSpent[r.featureId] ?? 0;
  return session.resourcesSpent[r.id] ?? 0;
}

function setResourceSpent(
  r: PlayResource,
  newSpent: number,
  dispatch: (a: PlaySessionAction) => void,
): void {
  if (r.featureId) {
    dispatch({ type: "CLEAR_FEATURE_USE", featureId: r.featureId });
    for (let j = 0; j < newSpent; j++) {
      dispatch({
        type: "SPEND_FEATURE_USE",
        featureId: r.featureId,
        max: r.max,
      });
    }
    return;
  }
  dispatch({ type: "CLEAR_RESOURCE", resourceId: r.id });
  for (let j = 0; j < newSpent; j++) {
    dispatch({ type: "SPEND_RESOURCE", resourceId: r.id, max: r.max });
  }
}

export function ResourcesPanel({
  compiled,
  session,
  dispatch,
  className,
}: ResourcesPanelProps) {
  if (compiled.resources.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <h3 className="text-sm font-semibold">Resources</h3>
        <p className="text-xs text-muted-foreground">No class resources.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold">Resources</h3>
      <ul className="space-y-2">
        {compiled.resources.map((r) => {
          const spent = spentForResource(r, session);
          const left = r.max - spent;
          return (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="block font-medium leading-tight">{r.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatRecoveryLabel(r.recovery)} · {left}/{r.max}
                </span>
              </span>
              <div className="flex shrink-0 gap-1">
                {Array.from({ length: r.max }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={cn(
                      "h-5 w-5 rounded-full border",
                      i < left
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40",
                    )}
                    aria-label={`${r.label} use ${i + 1}`}
                    onClick={() => {
                      // Filled = available: click sets remaining to i (spend) or i+1 (restore).
                      const newLeft = i < left ? i : i + 1;
                      setResourceSpent(r, r.max - newLeft, dispatch);
                    }}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface HitDicePanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  dispatch: (a: PlaySessionAction) => void;
  className?: string;
}

export function HitDicePanel({
  compiled,
  session,
  dispatch,
  className,
}: HitDicePanelProps) {
  if (compiled.hitDice.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold">Hit Dice</h3>
      <ul className="space-y-2">
        {compiled.hitDice.map((hd) => {
          const spent = session.hitDiceSpent[hd.die] ?? 0;
          const left = hd.max - spent;
          return (
            <li
              key={hd.die}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>
                {hd.die}{" "}
                <span className="text-muted-foreground">
                  ({left}/{hd.max} left)
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={left <= 0}
                onClick={() =>
                  dispatch({ type: "SPEND_HIT_DIE", dieKey: hd.die })
                }
              >
                Spend
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
