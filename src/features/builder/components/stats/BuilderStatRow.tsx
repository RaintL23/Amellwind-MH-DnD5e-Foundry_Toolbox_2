import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

interface BuilderStatRowProps {
  label: ReactNode;
  value: ReactNode;
  secondary?: ReactNode;
  proficient?: boolean;
}

export function BuilderStatRow({
  label,
  value,
  secondary,
  proficient,
}: BuilderStatRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/40 py-1.5 text-[12px] last:border-b-0",
        proficient && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "min-w-0 truncate text-muted-foreground",
          proficient && "font-medium text-foreground",
        )}
      >
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {secondary && (
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {secondary}
          </span>
        )}
        <span className="min-w-[2.5rem] text-right text-sm font-medium tabular-nums text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}
