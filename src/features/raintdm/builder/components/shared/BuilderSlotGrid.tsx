import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Shared auto-flow grid: equal-width slots, no placeholders, left-to-right wrap (3 → 4 → 5 columns). */
export const BUILDER_SLOT_GRID_CLASS =
  "grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5";

export function BuilderSlotGrid({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <div className={cn(BUILDER_SLOT_GRID_CLASS, className)}>{children}</div>
  );
}
