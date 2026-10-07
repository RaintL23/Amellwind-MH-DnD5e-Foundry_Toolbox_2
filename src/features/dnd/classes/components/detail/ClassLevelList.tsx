import { memo } from "react";
import type { ClassLevelRow } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { ClassFeatureChip } from "./ClassFeatureChip";

interface ClassLevelListProps {
  progression: ClassLevelRow[];
  colLabels: string[];
  hiddenFeatureUids: Set<string>;
  classSource?: string;
  onSelectFeature: (uid: string) => void;
  onToggleFeatureVisible: (uid: string) => void;
  className?: string;
}

const EMPTY_CELL = /^[\s—–-]*$/;

/** Stacked progression for narrow containers: one compact card per level, no horizontal scroll. */
export const ClassLevelList = memo(function ClassLevelList({
  progression,
  colLabels,
  hiddenFeatureUids,
  classSource,
  onSelectFeature,
  onToggleFeatureVisible,
  className,
}: ClassLevelListProps) {
  return (
    <ol className={cn("divide-y divide-border/60 rounded-md border border-border", className)}>
      {progression.map((row) => {
        const stats = colLabels
          .map((label, i) => ({ label, value: row.tableCells[i] ?? "" }))
          .filter((stat) => !EMPTY_CELL.test(stat.value));

        return (
          <li key={row.level} className="flex gap-3 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground">
              {row.level}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              {stats.length > 0 && (
                <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] leading-snug">
                  {stats.map((stat, i) => (
                    <div key={`${stat.label}-${i}`} className="flex gap-1">
                      <dt className="text-muted-foreground">{stat.label}</dt>
                      <dd className="font-medium tabular-nums text-foreground">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {row.features.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {row.features.map((feature) => (
                    <ClassFeatureChip
                      key={feature.uid}
                      feature={feature}
                      hidden={hiddenFeatureUids.has(feature.uid)}
                      classSource={classSource}
                      onSelect={onSelectFeature}
                      onToggleVisible={onToggleFeatureVisible}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[11px] italic text-muted-foreground">
                  No new features
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
