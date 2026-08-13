import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/** Fixed column count for all builder slot grids in the center panel. */
export const BUILDER_SLOT_COLUMNS = 5;

/** Shared auto-flow grid: equal-width slots, no placeholders, left-to-right wrap. */
export const BUILDER_SLOT_GRID_CLASS = "grid grid-cols-5 gap-1.5";

export function BuilderSlotGrid({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <div className={cn(BUILDER_SLOT_GRID_CLASS, className)}>{children}</div>
  );
}
