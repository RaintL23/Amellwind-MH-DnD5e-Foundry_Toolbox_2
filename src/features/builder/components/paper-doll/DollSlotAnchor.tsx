import { type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export function DollSlotAnchor({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return <div className={cn("absolute z-10", className)}>{children}</div>;
}
