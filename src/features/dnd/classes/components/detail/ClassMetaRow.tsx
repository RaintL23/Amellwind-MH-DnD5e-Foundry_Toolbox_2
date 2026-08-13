import { memo } from "react";
import { cn } from "@/shared/utils/cn";

interface ClassMetaRowProps {
  label: string;
  value: string;
  differs?: boolean;
}

export const ClassMetaRow = memo(function ClassMetaRow({
  label,
  value,
  differs,
}: ClassMetaRowProps) {
  return (
    <div className="flex gap-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32 shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-sm",
          differs ? "text-amber-300 font-medium" : "text-foreground",
        )}
      >
        {value}
        {differs && (
          <span className="ml-1.5 text-[10px] font-normal text-amber-500/80">
            (varies)
          </span>
        )}
      </span>
    </div>
  );
});
