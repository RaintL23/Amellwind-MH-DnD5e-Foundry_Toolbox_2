import { memo } from "react";
import { cn } from "@/shared/utils/cn";

interface UsesPipsProps {
  label: string;
  max: number;
  /** Remaining (available) uses — filled pips */
  left: number;
  onSetLeft: (newLeft: number) => void;
  className?: string;
  pipClassName?: string;
}

/**
 * Filled = remaining/available. Click a filled pip to spend down to that index;
 * click an empty pip to restore up through that index.
 */
export const UsesPips = memo(function UsesPips({
  label,
  max,
  left,
  onSetLeft,
  className,
  pipClassName,
}: UsesPipsProps) {
  if (max <= 0) return null;
  return (
    <div className={cn("flex shrink-0 gap-1", className)}>
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          className={cn(
            "h-5 w-5 rounded-full border",
            pipClassName,
            i < left
              ? "border-primary bg-primary"
              : "border-muted-foreground/40",
          )}
          aria-label={`${label} use ${i + 1}`}
          onClick={() => {
            const newLeft = i < left ? i : i + 1;
            onSetLeft(newLeft);
          }}
        />
      ))}
    </div>
  );
});
