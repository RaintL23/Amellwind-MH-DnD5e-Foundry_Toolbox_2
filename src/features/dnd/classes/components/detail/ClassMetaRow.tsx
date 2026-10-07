import { memo } from "react";
import { cn } from "@/shared/utils/cn";

interface ClassMetaRowProps {
  label: string;
  value: string;
  differs?: boolean;
  className?: string;
}

/** Stat tile: small uppercase label over the value; amber when it varies across sources. */
export const ClassMetaRow = memo(function ClassMetaRow({
  label,
  value,
  differs,
  className,
}: ClassMetaRowProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border px-2.5 py-2",
        differs
          ? "border-amber-600/40 bg-amber-500/5"
          : "border-border/70 bg-background/40",
        className,
      )}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {differs && (
          <span className="ml-1 font-normal normal-case text-amber-500/80">
            (varies)
          </span>
        )}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-sm font-medium leading-snug",
          differs ? "text-amber-300" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
});
