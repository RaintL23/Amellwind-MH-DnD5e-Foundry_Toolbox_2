import { memo } from "react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/components/ui/button";
import type {
  PlayCharacterCompiled,
  PlayResource,
  PlaySessionState,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import { formatRecoveryLabel } from "../utils/rest.utils";
import { UsesPips } from "./UsesPips";

interface ResourcesPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  dispatch: (a: PlaySessionAction) => void;
  /** Jump to the Features tab and expand the given feature. */
  onOpenFeature?: (featureId: string) => void;
  className?: string;
}

/** Feature a resource represents: its own feature, else a name match (Rages → Rage). */
function resolveResourceFeatureId(
  r: PlayResource,
  compiled: PlayCharacterCompiled,
): string | undefined {
  if (r.featureId) return r.featureId;
  const norm = (v: string) => v.trim().toLowerCase();
  const label = norm(r.label);
  const candidates = new Set([label, label.replace(/s$/, ""), label.replace(/ points$/, "")]);
  return compiled.features.find(
    (f) => f.sourceKind !== "standard" && candidates.has(norm(f.name)),
  )?.id;
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
    dispatch({
      type: "SET_FEATURE_USES_SPENT",
      featureId: r.featureId,
      spent: newSpent,
      max: r.max,
    });
    return;
  }
  dispatch({
    type: "SET_RESOURCE_SPENT",
    resourceId: r.id,
    spent: newSpent,
    max: r.max,
  });
}

export const ResourcesPanel = memo(function ResourcesPanel({
  compiled,
  session,
  dispatch,
  onOpenFeature,
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
          const featureId = onOpenFeature
            ? resolveResourceFeatureId(r, compiled)
            : undefined;
          return (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              {featureId ? (
                <button
                  type="button"
                  onClick={() => onOpenFeature?.(featureId)}
                  title={`Open ${r.label} in Features`}
                  className="min-w-0 rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block font-medium leading-tight">{r.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRecoveryLabel(r.recovery)} · {left}/{r.max}
                  </span>
                </button>
              ) : (
                <span className="min-w-0">
                  <span className="block font-medium leading-tight">{r.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRecoveryLabel(r.recovery)} · {left}/{r.max}
                  </span>
                </span>
              )}
              <UsesPips
                label={r.label}
                max={r.max}
                left={left}
                onSetLeft={(newLeft) =>
                  setResourceSpent(r, r.max - newLeft, dispatch)
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
});

interface HitDicePanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  dispatch: (a: PlaySessionAction) => void;
  className?: string;
}

export const HitDicePanel = memo(function HitDicePanel({
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
});
