import type { ReactElement, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/utils/cn";

interface HintTooltipProps {
  /** Trigger element; must accept ref/props (rendered with asChild). */
  children: ReactElement;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

const HINT_CONTENT_CLASS =
  "max-w-[min(16rem,calc(100vw-2rem))] whitespace-pre-line text-[10px] leading-relaxed";

/**
 * Help hint built on shadcn/Radix. Hover tooltip on mouse devices; on touch
 * devices (coarse pointer) it becomes a tap-to-open Popover, since Radix
 * tooltips never open from a tap.
 */
export function HintTooltip({
  children,
  content,
  side = "top",
  align = "center",
  className,
}: HintTooltipProps) {
  const isTouch = useMediaQuery("(pointer: coarse)");

  if (isTouch) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          className={cn("w-auto px-3 py-1.5", HINT_CONTENT_CLASS, className)}
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={cn(HINT_CONTENT_CLASS, className)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
