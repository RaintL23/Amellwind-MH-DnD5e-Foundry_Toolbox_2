import { useMemo, useState } from "react";
import type { MonstieClassFeature } from "@/shared/types";
import { DndRichText } from "@/shared/components/DndRichText";
import { cn } from "@/shared/utils/cn";
import { ChevronDown } from "lucide-react";

interface MonstieClassFeaturesListProps {
  features: MonstieClassFeature[];
}

export function MonstieClassFeaturesList({
  features,
}: MonstieClassFeaturesListProps) {
  const byLevel = useMemo(() => {
    const map = new Map<number, MonstieClassFeature[]>();
    for (const f of features) {
      const list = map.get(f.level) ?? [];
      list.push(f);
      map.set(f.level, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [features]);

  const [openLevels, setOpenLevels] = useState<Set<number>>(
    () => new Set([1, 2, 3]),
  );

  const toggleLevel = (level: number) => {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  if (features.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="text-base font-semibold text-foreground">
        Class features (detailed)
      </h3>
      <p className="text-sm text-muted-foreground">
        Complete text of each feature of Monstie Sidekick from the AGMH guide.
      </p>

      <div className="space-y-2">
        {byLevel.map(([level, levelFeatures]) => {
          const open = openLevels.has(level);
          return (
            <div
              key={level}
              className="rounded-md border border-border overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-primary">
                  Level {level}
                </span>
                <span className="text-xs text-muted-foreground">
                  {levelFeatures.length} feature
                  {levelFeatures.length !== 1 ? "s" : ""}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>

              {open && (
                <div className="px-3 py-3 space-y-4 border-t border-border">
                  {levelFeatures.map((feature) => (
                    <article key={`${feature.name}-${feature.level}`}>
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          {feature.name}
                        </h4>
                        {feature.page != null && (
                          <span className="text-[11px] text-muted-foreground">
                            p. {feature.page}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {feature.entries.map((line, i) => (
                          <p
                            key={i}
                            className="text-sm text-muted-foreground leading-relaxed"
                          >
                            <DndRichText text={line} />
                          </p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
