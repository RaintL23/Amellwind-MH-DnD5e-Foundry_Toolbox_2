import { useCallback, useLayoutEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useClassDetailPage } from "../hooks/useClassDetailPage";
import { ClassDetailLoading } from "./detail/ClassDetailLoading";
import { ClassDetailNotFound } from "./detail/ClassDetailNotFound";
import { ClassDetailHeader } from "./detail/ClassDetailHeader";
import { ClassDetailMetaSection } from "./detail/ClassDetailMetaSection";
import { ClassSubclassSelector } from "./detail/ClassSubclassSelector";
import { ClassLevelTable } from "./detail/ClassLevelTable";
import { ClassFeatureDetailsPanel } from "./detail/ClassFeatureDetailsPanel";

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
    enabledFeatureUids,
    enabledFeatures,
    activeSubclassId,
    toggleFeature,
    handleSourceSelect,
    handleSubclassSelect,
  } = useClassDetailPage(classId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);
  const shouldRestoreScroll = useRef(false);

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

  if (loading) {
    return <ClassDetailLoading />;
  }

  if (notFound || !cls || !active) {
    return <ClassDetailNotFound />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ClassDetailHeader
        active={active}
        variants={variants}
        varyingFields={varyingFields}
        bookNames={bookNames}
        onSourceSelect={handleSourceSelectPreserveScroll}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <ClassDetailMetaSection
            active={active}
            variantSubclasses={variantSubclasses}
            differs={differs}
          />

          <ClassSubclassSelector
            subclasses={variantSubclasses}
            activeSubclassId={activeSubclassId}
            onSelect={handleSubclassSelect}
            subclassTitle={active.subclassTitle}
          />

          <Separator />

          <ClassLevelTable
            progression={mergedProgression}
            tableGroups={active.spellProgression}
            enabledFeatureUids={enabledFeatureUids}
            onToggleFeature={toggleFeature}
          />

          <ClassFeatureDetailsPanel features={enabledFeatures} />
        </div>
      </div>
    </div>
  );
}
