import { memo, useCallback, useMemo, useState } from "react";
import type {
  Class,
  ClassFeatureEntry,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import { DndRichText } from "@/shared/components/DndRichText";
import { cn } from "@/shared/utils/cn";
import {
  buildOptionalFeaturePhraseLinks,
  findProgressionById,
  findProgressionForFeatureName,
} from "../../utils/class-optional-feature-browse.utils";
import { ClassOptionalFeatureOptionsDialog } from "./ClassOptionalFeatureOptionsDialog";

interface ClassFeatureDetailPanelProps {
  feature: ClassFeatureEntry;
  phraseLinks: ReturnType<typeof buildOptionalFeaturePhraseLinks>;
  onPhraseClick: (phraseId: string) => void;
  onTitleClick?: (progressionId: string) => void;
  titleProgressionId?: string | null;
}

const ClassFeatureDetailPanel = memo(function ClassFeatureDetailPanel({
  feature,
  phraseLinks,
  onPhraseClick,
  onTitleClick,
  titleProgressionId,
}: ClassFeatureDetailPanelProps) {
  const titleClickable = Boolean(titleProgressionId && onTitleClick);

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {titleClickable ? (
          <button
            type="button"
            onClick={() => onTitleClick?.(titleProgressionId!)}
            className="text-sm font-semibold text-sky-300 hover:underline underline-offset-2"
            title="View options"
          >
            {feature.displayName}
          </button>
        ) : (
          <h4 className="text-sm font-semibold text-sky-300">
            {feature.displayName}
          </h4>
        )}
        <Badge className="bg-violet-950/60 text-violet-300 border-violet-800/50 text-[10px]">
          Level {feature.level}
        </Badge>
        {feature.isSubclassFeature && (
          <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/50 text-[10px]">
            Subclass
          </Badge>
        )}
        <Badge variant="secondary" className="text-[10px]">
          {feature.source}
        </Badge>
      </div>
      {feature.content.length > 0 ? (
        <StatBlockContentView
          content={feature.content}
          phraseLinks={phraseLinks}
          onPhraseClick={onPhraseClick}
        />
      ) : feature.description.length > 0 ? (
        <div className="space-y-1.5">
          {feature.description.map((line, i) => (
            <p
              key={i}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              <DndRichText
                text={line}
                phraseLinks={phraseLinks}
                onPhraseClick={onPhraseClick}
              />
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No description available.
        </p>
      )}
    </div>
  );
});

interface ClassFeatureDetailsPanelProps {
  features: ClassFeatureEntry[];
  classData?: Class | null;
  subclass?: Subclass | null;
  progressions?: OptionalFeatureProgression[];
  className?: string;
}

export const ClassFeatureDetailsPanel = memo(function ClassFeatureDetailsPanel({
  features,
  classData = null,
  subclass = null,
  progressions = [],
  className,
}: ClassFeatureDetailsPanelProps) {
  const [activeProgressionId, setActiveProgressionId] = useState<string | null>(
    null,
  );

  const phraseLinks = useMemo(
    () => buildOptionalFeaturePhraseLinks(progressions),
    [progressions],
  );

  const activeProgression = useMemo(
    () =>
      activeProgressionId
        ? findProgressionById(progressions, activeProgressionId)
        : null,
    [progressions, activeProgressionId],
  );

  const handlePhraseClick = useCallback((phraseId: string) => {
    setActiveProgressionId(phraseId);
  }, []);

  const titleProgressionByFeatureUid = useMemo(() => {
    const map = new Map<string, string>();
    for (const feature of features) {
      const match =
        findProgressionForFeatureName(progressions, feature.name) ??
        findProgressionForFeatureName(progressions, feature.displayName);
      if (match) map.set(feature.uid, match.id);
    }
    return map;
  }, [features, progressions]);

  if (features.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground italic">
        No features selected.
      </p>
    );
  }

  return (
    <>
      <div className={cn("space-y-3", className ?? "mt-4")}>
        {features.map((feature) => (
          <ClassFeatureDetailPanel
            key={feature.uid}
            feature={feature}
            phraseLinks={phraseLinks}
            onPhraseClick={handlePhraseClick}
            onTitleClick={handlePhraseClick}
            titleProgressionId={
              titleProgressionByFeatureUid.get(feature.uid) ?? null
            }
          />
        ))}
      </div>

      <ClassOptionalFeatureOptionsDialog
        open={activeProgressionId !== null}
        onOpenChange={(open) => {
          if (!open) setActiveProgressionId(null);
        }}
        progression={activeProgression}
        classData={classData}
        subclass={subclass}
      />
    </>
  );
});
