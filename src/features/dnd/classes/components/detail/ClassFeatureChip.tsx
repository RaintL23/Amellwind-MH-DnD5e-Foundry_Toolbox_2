import { memo, useCallback } from "react";
import { Eye, EyeOff, GitBranch } from "lucide-react";
import { ClassFeatureEntry } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

interface ClassFeatureChipProps {
  feature: ClassFeatureEntry;
  hidden: boolean;
  /** Class source; the chip only shows its own source when it differs. */
  classSource?: string;
  onSelect: (uid: string) => void;
  onToggleVisible: (uid: string) => void;
}

export const ClassFeatureChip = memo(function ClassFeatureChip({
  feature,
  hidden,
  classSource,
  onSelect,
  onToggleVisible,
}: ClassFeatureChipProps) {
  const handleSelect = useCallback(
    () => onSelect(feature.uid),
    [onSelect, feature.uid],
  );
  const handleToggle = useCallback(
    () => onToggleVisible(feature.uid),
    [onToggleVisible, feature.uid],
  );

  const isSubclass = Boolean(feature.isSubclassFeature);
  const showSource =
    Boolean(feature.source) &&
    feature.source !== feature.name &&
    feature.source !== classSource;

  return (
    <span
      className={cn(
        "group inline-flex max-w-full items-stretch overflow-hidden rounded border text-xs font-medium transition-colors @4xl/classdetail:text-[11px]",
        isSubclass
          ? "border-emerald-600/70 bg-emerald-500/15 text-emerald-200"
          : "border-sky-600/70 bg-sky-500/15 text-sky-200",
        hidden && "border-dashed border-border bg-transparent text-muted-foreground",
      )}
    >
      <button
        type="button"
        onClick={handleSelect}
        title={hidden ? "Show and jump to feature" : "Jump to feature"}
        className={cn(
          "inline-flex min-w-0 items-center gap-1 px-2 py-1.5 text-left hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring @4xl/classdetail:px-1.5 @4xl/classdetail:py-0.5",
          hidden && "line-through decoration-muted-foreground/60",
        )}
      >
        {isSubclass && (
          <GitBranch
            className="h-3 w-3 shrink-0 opacity-70"
            aria-label="Subclass feature"
          />
        )}
        <span className="truncate">{feature.displayName}</span>
        {showSource && (
          <span className="shrink-0 text-[9px] font-normal opacity-60">
            {feature.source}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={hidden ? `Show ${feature.displayName}` : `Hide ${feature.displayName}`}
        title={hidden ? "Show in feature list" : "Hide from feature list"}
        aria-pressed={hidden}
        className="inline-flex shrink-0 items-center border-l border-foreground/10 px-1.5 opacity-60 transition-opacity hover:bg-foreground/5 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring @4xl/classdetail:px-1 @4xl/classdetail:opacity-40 @4xl/classdetail:group-hover:opacity-100 @4xl/classdetail:focus-visible:opacity-100"
      >
        {hidden ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </button>
    </span>
  );
});
