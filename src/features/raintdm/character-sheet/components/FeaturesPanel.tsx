import { useDeferredValue, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  PlayActivationBucket,
  PlayCharacterCompiled,
  PlayFeature,
  PlaySessionState,
} from "../utils/play-character.types";
import type { PlaySessionAction } from "../utils/play-session-reducer";
import { formatRecoveryLabel } from "../utils/rest.utils";
import { toDescriptionLines } from "../utils/description-lines.utils";
import { DescriptionLines } from "@/shared/components/DescriptionLines";
import { NotesPanel } from "./NotesPanel";

interface FeaturesPanelProps {
  compiled: PlayCharacterCompiled;
  session: PlaySessionState;
  dispatch: (a: PlaySessionAction) => void;
}

const BUCKET_BADGE: Partial<Record<PlayActivationBucket, string>> = {
  action: "Action",
  bonus: "Bonus Action",
  reaction: "Reaction",
  other: "Special",
};

export function FeaturesPanel({
  compiled,
  session,
  dispatch,
}: FeaturesPanelProps) {
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  // All character features (every activation bucket). Standard PHB actions stay
  // on the Actions tab only — they are not build-specific traits.
  const features = useMemo(() => {
    const list = compiled.features.filter((f) => f.sourceKind !== "standard");
    const query = deferredQ.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.sourceLabel.toLowerCase().includes(query) ||
        (f.statEffects ?? []).some((e) =>
          e.label.toLowerCase().includes(query),
        ),
    );
  }, [compiled.features, deferredQ]);

  const bySource = useMemo(() => {
    const map = new Map<string, PlayFeature[]>();
    for (const f of features) {
      const key = f.sourceLabel || f.sourceKind;
      const arr = map.get(key) ?? [];
      arr.push(f);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [features]);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-1 backdrop-blur">
        <Input
          placeholder="Search features…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {bySource.map(([source, feats]) => (
        <section key={source}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            {source}{" "}
            <span className="font-normal">({feats.length})</span>
          </h3>
          <Accordion type="multiple" className="space-y-2">
            {feats.map((f) => {
              const effects = f.statEffects ?? [];
              const bucketLabel = BUCKET_BADGE[f.bucket];
              const uses = f.uses;
              return (
                <Card key={f.id} className="overflow-hidden shadow-none">
                  <AccordionItem value={f.id} className="border-0">
                    <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                        <span className="font-medium">{f.name}</span>
                        {effects.length > 0 || bucketLabel || uses ? (
                          <span className="flex flex-wrap gap-1">
                            {bucketLabel ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-normal"
                              >
                                {bucketLabel}
                              </Badge>
                            ) : null}
                            {uses ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-normal"
                              >
                                {uses.max} use{uses.max === 1 ? "" : "s"} ·{" "}
                                {formatRecoveryLabel(uses.recovery)}
                              </Badge>
                            ) : null}
                            {effects.map((e) => (
                              <Badge
                                key={`${e.kind}-${e.label}`}
                                variant="secondary"
                                className="text-[10px] font-normal"
                              >
                                Active · {e.label}
                              </Badge>
                            ))}
                          </span>
                        ) : null}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 px-3 pb-3">
                      {effects.length > 0 ? (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Currently applying:{" "}
                          {effects.map((e) => e.label).join(" · ")}
                        </p>
                      ) : null}
                      <DescriptionLines
                        lines={toDescriptionLines(f.description)}
                        sizeClass="text-xs"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              );
            })}
          </Accordion>
        </section>
      ))}
      {features.length === 0 ? (
        <p className="text-sm text-muted-foreground">No features.</p>
      ) : null}

      <NotesPanel notes={session.notes} dispatch={dispatch} />
    </div>
  );
}
