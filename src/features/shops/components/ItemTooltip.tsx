type TooltipState = { x: number; y: number; text: string } | null;

export function ItemTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;

  return (
    <div
      className="fixed z-50 max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg pointer-events-none"
      style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
    >
      {tooltip.text}
    </div>
  );
}

export type { TooltipState };
