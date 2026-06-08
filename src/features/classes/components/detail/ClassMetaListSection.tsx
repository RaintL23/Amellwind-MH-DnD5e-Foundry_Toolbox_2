import { memo, useMemo } from "react";
import type { ClassMetaListGroup } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import { normalizeClassMetaGroups } from "../../utils/class-meta-list.utils";

interface ClassMetaListSectionProps {
  heading: string;
  items?: string[];
  groups?: ClassMetaListGroup[] | string[];
  differs?: boolean;
}

export const ClassMetaListSection = memo(function ClassMetaListSection({
  heading,
  items,
  groups,
  differs,
}: ClassMetaListSectionProps) {
  const normalizedGroups = useMemo(
    () => normalizeClassMetaGroups(groups),
    [groups],
  );
  const flatItems = useMemo(
    () => (items ?? []).map((item) => item.trim()).filter(Boolean),
    [items],
  );

  const hasGroups = normalizedGroups.length > 0;
  const hasItems = flatItems.length > 0;
  if (!hasGroups && !hasItems) return null;

  const itemClass = cn(
    "leading-relaxed text-[13px]",
    differs ? "text-amber-300/90" : "text-muted-foreground",
  );

  const labelClass = cn(
    "text-xs font-medium",
    differs ? "text-amber-400" : "text-foreground/80",
  );

  return (
    <div className="space-y-1.5">
      <h4
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          differs ? "text-amber-400" : "text-muted-foreground",
        )}
      >
        {heading}
        {differs && (
          <span className="ml-1.5 text-[10px] font-normal normal-case text-amber-500/80">
            (varies)
          </span>
        )}
      </h4>

      {hasGroups && (
        <div className="grid gap-x-4 gap-y-3 grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]">
          {normalizedGroups.map((group, groupIndex) => (
            <div key={`${group.label}-${groupIndex}`} className="min-w-0">
              <p className={labelClass}>{group.label}</p>
              <ul className="mt-0.5 list-disc list-inside pl-1 space-y-0.5">
                {group.items.map((item, i) => (
                  <li key={i} className={itemClass}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {hasItems && (
        <ul className="list-disc list-inside pl-1 space-y-1 text-sm">
          {flatItems.map((item, i) => (
            <li key={i} className={itemClass}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
