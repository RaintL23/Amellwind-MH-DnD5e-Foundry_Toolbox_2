import { memo, useCallback } from "react";
import { ClassFeatureEntry } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface ClassFeatureChipProps {
  feature: ClassFeatureEntry;
  enabled: boolean;
  onToggle: (uid: string) => void;
}

export const ClassFeatureChip = memo(function ClassFeatureChip({
  feature,
  enabled,
  onToggle,
}: ClassFeatureChipProps) {
  const handleClick = useCallback(
    () => onToggle(feature.uid),
    [onToggle, feature.uid],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors text-left",
        enabled
          ? "border-sky-500 bg-sky-500/20 text-sky-200"
          : feature.isSubclassFeature
            ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-300/50 hover:bg-emerald-950/50"
            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
      )}
    >
      {feature.displayName}
      {feature.isSubclassFeature && (
        <span className="text-[9px] opacity-70">SC</span>
      )}
      {feature.source !== feature.name && feature.source && (
        <span className="text-[9px] opacity-50 font-normal">
          {feature.source}
        </span>
      )}
    </button>
  );
});
