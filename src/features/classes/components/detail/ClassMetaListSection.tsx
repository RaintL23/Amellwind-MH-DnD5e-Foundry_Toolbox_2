import { memo } from "react";
import { cn } from "@/shared/utils/cn";

interface ClassMetaListSectionProps {
  heading: string;
  items: string[];
  differs?: boolean;
}

export const ClassMetaListSection = memo(function ClassMetaListSection({
  heading,
  items,
  differs,
}: ClassMetaListSectionProps) {
  if (!items.length) return null;

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
      <ul className="text-sm space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              "leading-relaxed text-[13px]",
              differs ? "text-amber-300/90" : "text-muted-foreground",
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
});
