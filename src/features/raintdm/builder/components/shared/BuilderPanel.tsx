import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

interface BuilderPanelProps {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
}

export function BuilderPanel({
  title,
  action,
  children,
  className,
  highlighted = false,
}: Readonly<BuilderPanelProps>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card p-3.5",
        highlighted &&
          "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30",
        className,
      )}
    >
      <div className="mb-3 flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
        {action && <span className="ml-auto font-normal normal-case">{action}</span>}
      </div>
      {children}
    </div>
  );
}
