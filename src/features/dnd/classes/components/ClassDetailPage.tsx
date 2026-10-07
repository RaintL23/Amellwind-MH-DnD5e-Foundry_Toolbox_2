import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { ChevronsDownUp, ChevronsUpDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClassDetailPage } from "../hooks/useClassDetailPage";
import {
  CLASS_FEATURE_ANCHOR_PREFIX,
  scrollBehavior,
} from "../utils/class-detail-scroll.utils";
import { ClassDetailLoading } from "./detail/ClassDetailLoading";
import { ClassDetailNotFound } from "./detail/ClassDetailNotFound";
import { ClassDetailHeader } from "./detail/ClassDetailHeader";
import { ClassDetailMetaSection } from "./detail/ClassDetailMetaSection";
import {
  ClassDetailSectionNav,
  type ClassDetailSection,
} from "./detail/ClassDetailSectionNav";
import { ClassLevelTable } from "./detail/ClassLevelTable";
import { ClassFeatureDetailsPanel } from "./detail/ClassFeatureDetailsPanel";

const SECTION_IDS = {
  overview: "class-section-overview",
  progression: "class-section-progression",
  features: "class-section-features",
} as const;

// Sticky nav height; table header, level headings and scroll targets offset by it.
const SCROLL_CONTAINER_STYLE = { "--class-nav-h": "2.75rem" } as CSSProperties;

const HIGHLIGHT_MS = 1600;

function DetailSection({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-[var(--class-nav-h)] space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2
          id={`${id}-title`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function ClassDetailPage() {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = classIdParam ? decodeURIComponent(classIdParam) : "";

  const {
    loading,
    notFound,
    cls,
    active,
    variants,
    variantSubclasses,
    bookNames,
    varyingFields,
    differs,
    mergedProgression,
    mergedTableGroups,
    hiddenFeatureUids,
    visibleFeatures,
    totalFeatureCount,
    activeSubclass,
    optionalFeatureProgressions,
    activeSubclassId,
    toggleFeatureVisibility,
    showFeature,
    showAllFeatures,
    handleSourceSelect,
    handleSubclassSelect,
  } = useClassDetailPage(classId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);
  const shouldRestoreScroll = useRef(false);

  const [collapsedUids, setCollapsedUids] = useState<Set<string>>(
    () => new Set(),
  );
  const [highlightUid, setHighlightUid] = useState<string | null>(null);
  const highlightTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  const handleSourceSelectPreserveScroll = useCallback(
    (id: string) => {
      if (scrollRef.current) {
        savedScrollTop.current = scrollRef.current.scrollTop;
        shouldRestoreScroll.current = true;
      }
      handleSourceSelect(id);
    },
    [handleSourceSelect],
  );

  useLayoutEffect(() => {
    if (!shouldRestoreScroll.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = savedScrollTop.current;
    shouldRestoreScroll.current = false;
  }, [active?.id]);

  const handleSelectFeature = useCallback(
    (uid: string) => {
      showFeature(uid);
      setCollapsedUids((prev) => {
        if (!prev.has(uid)) return prev;
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
      // Wait one frame so a previously hidden card is mounted before scrolling.
      requestAnimationFrame(() => {
        document
          .getElementById(`${CLASS_FEATURE_ANCHOR_PREFIX}${uid}`)
          ?.scrollIntoView({ block: "start", behavior: scrollBehavior() });
      });
      setHighlightUid(uid);
      window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(
        () => setHighlightUid(null),
        HIGHLIGHT_MS,
      );
    },
    [showFeature],
  );

  const toggleCollapsed = useCallback((uid: string) => {
    setCollapsedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const allCollapsed =
    visibleFeatures.length > 0 &&
    visibleFeatures.every((f) => collapsedUids.has(f.uid));

  const toggleCollapseAll = useCallback(() => {
    setCollapsedUids(
      allCollapsed ? new Set() : new Set(visibleFeatures.map((f) => f.uid)),
    );
  }, [allCollapsed, visibleFeatures]);

  const sections = useMemo(
    (): ClassDetailSection[] => [
      { id: SECTION_IDS.overview, label: "Overview" },
      { id: SECTION_IDS.progression, label: "Progression" },
      {
        id: SECTION_IDS.features,
        label: "Features",
        count: visibleFeatures.length,
      },
    ],
    [visibleFeatures.length],
  );

  if (loading) {
    return <ClassDetailLoading />;
  }

  if (notFound || !cls || !active) {
    return <ClassDetailNotFound />;
  }

  const hiddenCount = totalFeatureCount - visibleFeatures.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <ClassDetailHeader
        active={active}
        variants={variants}
        varyingFields={varyingFields}
        bookNames={bookNames}
        onSourceSelect={handleSourceSelectPreserveScroll}
      />

      <div
        ref={scrollRef}
        style={SCROLL_CONTAINER_STYLE}
        className="@container/classdetail flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="mx-auto max-w-[88rem] px-3 pb-6 @lg/classdetail:px-4 @4xl/classdetail:px-6 @4xl/classdetail:pb-10">
          <ClassDetailSectionNav sections={sections} scrollRootRef={scrollRef} />

          <div className="space-y-6 @4xl/classdetail:space-y-8">
            <DetailSection id={SECTION_IDS.overview} title="Overview">
              <ClassDetailMetaSection
                active={active}
                variantSubclasses={variantSubclasses}
                differs={differs}
                activeSubclassId={activeSubclassId}
                onSubclassSelect={handleSubclassSelect}
                bookNames={bookNames}
              />
            </DetailSection>

            <DetailSection
              id={SECTION_IDS.progression}
              title={`${active.name} progression`}
              aside={
                <p className="text-[11px] text-muted-foreground">
                  Select a feature to jump to it ·{" "}
                  <Eye className="inline h-3 w-3 align-[-2px]" /> hides it
                </p>
              }
            >
              <ClassLevelTable
                progression={mergedProgression}
                tableGroups={mergedTableGroups}
                hiddenFeatureUids={hiddenFeatureUids}
                classSource={active.source}
                onSelectFeature={handleSelectFeature}
                onToggleFeatureVisible={toggleFeatureVisibility}
              />
            </DetailSection>

            <DetailSection
              id={SECTION_IDS.features}
              title="Features"
              aside={
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    Showing {visibleFeatures.length} of {totalFeatureCount}
                  </span>
                  {hiddenCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={showAllFeatures}
                    >
                      Show all
                    </Button>
                  )}
                  {visibleFeatures.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={toggleCollapseAll}
                      aria-label={allCollapsed ? "Expand all features" : "Collapse all features"}
                    >
                      {allCollapsed ? (
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsDownUp className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden @md/classdetail:inline">
                        {allCollapsed ? "Expand all" : "Collapse all"}
                      </span>
                    </Button>
                  )}
                </div>
              }
            >
              {hiddenCount > 0 && (
                <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                  {hiddenCount} feature{hiddenCount === 1 ? " is" : "s are"}{" "}
                  hidden. Use the <Eye className="inline h-3 w-3 align-[-2px]" />{" "}
                  in the progression table to restore{" "}
                  {hiddenCount === 1 ? "it" : "them"}, or{" "}
                  <button
                    type="button"
                    onClick={showAllFeatures}
                    className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                  >
                    show all
                  </button>
                  .
                </p>
              )}
              <ClassFeatureDetailsPanel
                className="space-y-3"
                features={visibleFeatures}
                classData={active}
                subclass={activeSubclass}
                progressions={optionalFeatureProgressions}
                groupByLevel
                anchorIdPrefix={CLASS_FEATURE_ANCHOR_PREFIX}
                highlightUid={highlightUid}
                hideSourceEqualTo={active.source}
                contentClassName="max-w-[80ch]"
                collapsedUids={collapsedUids}
                onToggleCollapsed={toggleCollapsed}
              />
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  );
}
