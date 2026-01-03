/**
 * Tooltip Component
 * 
 * Simple tooltip for displaying additional information on hover
 * Uses pure CSS for better performance
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className="relative inline-flex group">
      {children}
      <div
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm",
          "bg-popover text-popover-foreground rounded-md shadow-md border",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
          "transition-opacity duration-200 pointer-events-none",
          "whitespace-nowrap z-50",
          className
        )}
      >
        {content}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-popover" />
        </div>
      </div>
    </div>
  );
}

