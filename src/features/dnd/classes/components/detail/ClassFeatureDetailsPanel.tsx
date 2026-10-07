import { Fragment, memo, useCallback, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type {
  Class,
  ClassFeatureEntry,
  OptionalFeatureProgression,
  Subclass,
} from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatBlockContentView } from "@/components/statblock/StatBlockContentView";
import { DndRichText } from "@/shared/components/DndRichText";
import { cn } from "@/shared/utils/cn";
import { entriesMentionProficiencyGrant } from "@/shared/utils/library-proficiency-highlight.utils";
import {
  ProficiencyGrantBadge,
} from "@/shared/components/LibraryProficiencyHighlight";
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
  anchorId?: string;
  highlighted?: boolean;
  hideSourceEqualTo?: string;
  contentClassName?: string;
  /** When set, the body is collapsible and controlled by `collapsed`. */
  onToggleCollapsed?: (uid: string) => void;
  collapsed?: boolean;
}

const ClassFeatureDetailPanel = memo(function ClassFeatureDetailPanel({
  feature,
  phraseLinks,
  onPhraseClick,
  onTitleClick,
  titleProgressionId,
  anchorId,
  highlighted = false,
  hideSourceEqualTo,
  contentClassName,
  onToggleCollapsed,
  collapsed = false,
}: ClassFeatureDetailPanelProps) {
  const titleClickable = Boolean(titleProgressionId && onTitleClick);
  const grantsProficiency = entriesMentionProficiencyGrant(feature.description);
  const collapsible = Boolean(onToggleCollapsed);
  const showSource = !hideSourceEqualTo || feature.source !== hideSourceEqualTo;

  const body =
    feature.content.length > 0 ? (
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
    );

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={() => onToggleCollapsed?.(feature.uid)}
      id={anchorId}
      className={cn(
        "rounded-md border p-3 space-y-2 transition-shadow duration-500",
        anchorId && "scroll-mt-[calc(var(--class-nav-h,0px)+2.75rem)]",
        grantsProficiency
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-border bg-muted/20",
        highlighted &&
          "ring-2 ring-sky-400/70 ring-offset-2 ring-offset-background",
        collapsible && collapsed && "space-y-0",
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {collapsible && (
          <CollapsibleTrigger
            className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={
              collapsed
                ? `Expand ${feature.displayName}`
                : `Collapse ${feature.displayName}`
            }
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "-rotate-90",
              )}
            />
          </CollapsibleTrigger>
        )}
        {titleClickable ? (
          <button
            type="button"
            onClick={() => onTitleClick?.(titleProgressionId!)}
            className="text-sm font-semibold text-sky-300 underline underline-offset-2 decoration-sky-300/55 hover:decoration-sky-300 cursor-pointer"
            title="View options"
          >
            {feature.displayName}
          </button>
        ) : (
          <h4 className="text-sm font-semibold text-sky-300">
            {feature.displayName}
          </h4>
        )}
        {grantsProficiency && <ProficiencyGrantBadge />}
        <Badge className="bg-violet-950/60 text-violet-300 border-violet-800/50 text-[10px]">
          Level {feature.level}
        </Badge>
        {feature.isSubclassFeature && (
          <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/50 text-[10px]">
            Subclass
          </Badge>
        )}
        {showSource && (
          <Badge variant="secondary" className="text-[10px]">
            {feature.source}
          </Badge>
        )}
      </div>
      {collapsible ? (
        <CollapsibleContent className={contentClassName}>
          {body}
        </CollapsibleContent>
      ) : (
        <div className={contentClassName}>{body}</div>
      )}
    </Collapsible>
  );
});

interface ClassFeatureDetailsPanelProps {
  features: ClassFeatureEntry[];
  classData?: Class | null;
  subclass?: Subclass | null;
  progressions?: OptionalFeatureProgression[];
  className?: string;
  /** Opt-in (wiki page): render a heading before each level group. */
  groupByLevel?: boolean;
  /** Opt-in: sets `id={anchorIdPrefix + uid}` on each card for scroll targets. */
  anchorIdPrefix?: string;
  highlightUid?: string | null;
  hideSourceEqualTo?: string;
  /** Applied to each card body (e.g. a readable max width). */
  contentClassName?: string;
  /** Opt-in: controlled collapse state; cards are collapsible when provided. */
  collapsedUids?: Set<string>;
  onToggleCollapsed?: (uid: string) => void;
}

export const ClassFeatureDetailsPanel = memo(function ClassFeatureDetailsPanel({
  features,
  classData = null,
  subclass = null,
  progressions = [],
  className,
  groupByLevel = false,
  anchorIdPrefix,
  highlightUid = null,
  hideSourceEqualTo,
  contentClassName,
  collapsedUids,
  onToggleCollapsed,
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
        {features.map((feature, i) => (
          <Fragment key={feature.uid}>
            {groupByLevel && feature.level !== features[i - 1]?.level && (
              <h3 className="sticky top-[var(--class-nav-h,0px)] z-[4] -mx-1 bg-background/95 px-1 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-violet-400 backdrop-blur first:pt-0">
                Level {feature.level}
              </h3>
            )}
            <ClassFeatureDetailPanel
              feature={feature}
              phraseLinks={phraseLinks}
              onPhraseClick={handlePhraseClick}
              onTitleClick={handlePhraseClick}
              titleProgressionId={
                titleProgressionByFeatureUid.get(feature.uid) ?? null
              }
              anchorId={
                anchorIdPrefix ? `${anchorIdPrefix}${feature.uid}` : undefined
              }
              highlighted={highlightUid === feature.uid}
              hideSourceEqualTo={hideSourceEqualTo}
              contentClassName={contentClassName}
              onToggleCollapsed={onToggleCollapsed}
              collapsed={collapsedUids?.has(feature.uid) ?? false}
            />
          </Fragment>
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
