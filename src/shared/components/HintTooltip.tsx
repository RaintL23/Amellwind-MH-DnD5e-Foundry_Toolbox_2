import type { ReactElement, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/cn";

interface HintTooltipProps {
  /** Elemento disparador; debe aceptar ref/props (se usa asChild). */
  children: ReactElement;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

/**
 * Tooltip de ayuda basado en shadcn/Radix. Sustituye el patrón manual
 * `group` + `role="tooltip"` + `group-hover:opacity-100` usado en la app.
 */
export function HintTooltip({
  children,
  content,
  side = "top",
  align = "center",
  className,
}: HintTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={cn(
          "max-w-[min(16rem,calc(100vw-2rem))] whitespace-pre-line text-[10px] leading-relaxed",
          className,
        )}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
