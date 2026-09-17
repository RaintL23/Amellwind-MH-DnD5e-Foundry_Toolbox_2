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

const CHIP_GROUP_LABELS = new Set(["Skills", "Languages", "Tools"]);

function parseChooseFrom(
  item: string,
): { prefix: string; options: string[] } | null {
  const match = /^Choose (\d+) from (.+)$/i.exec(item.trim());
  if (!match) return null;
  const options = match[2]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (options.length < 2) return null;
  return { prefix: `Choose ${match[1]} from`, options };
}

function shouldUseChips(group: ClassMetaListGroup): boolean {
  if (CHIP_GROUP_LABELS.has(group.label)) return true;
  if (group.items.length >= 4) return true;
  return group.items.some((item) => parseChooseFrom(item) !== null);
}

function ChipList({
  items,
  differs,
}: {
  items: string[];
  differs?: boolean;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className={cn(
            "inline-flex rounded-md border px-1.5 py-0.5 text-[12px] leading-snug",
            differs
              ? "border-amber-700/50 bg-amber-950/30 text-amber-200/90"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
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
          {normalizedGroups.map((group, groupIndex) => {
            const useChips = shouldUseChips(group);
            return (
              <div
                key={`${group.label}-${groupIndex}`}
                className={cn("min-w-0", useChips && "col-span-2")}
              >
                <p className={labelClass}>{group.label}</p>
                {useChips ? (
                  <div className="mt-0.5 space-y-1.5">
                    {group.items.map((item, i) => {
                      const choose = parseChooseFrom(item);
                      if (!choose) return null;
                      return (
                        <div key={i}>
                          <p className={itemClass}>{choose.prefix}</p>
                          <ChipList
                            items={choose.options}
                            differs={differs}
                          />
                        </div>
                      );
                    })}
                    {(() => {
                      const plain = group.items.filter(
                        (item) => !parseChooseFrom(item),
                      );
                      return plain.length > 0 ? (
                        <ChipList items={plain} differs={differs} />
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <ul className="mt-0.5 list-disc list-inside pl-1 space-y-0.5">
                    {group.items.map((item, i) => (
                      <li key={i} className={itemClass}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
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
