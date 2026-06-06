import { Button } from "@/components/ui/button";

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "sm",
  className = "",
  ariaLabel,
  title,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  title?: string;
}) {
  const buttonClass = size === "sm" ? "h-6 w-6 text-xs" : "h-7 w-7 text-xs";
  const valueClass =
    size === "sm"
      ? "w-6 text-center text-base font-medium text-foreground tabular-nums"
      : "w-8 text-center text-sm font-semibold text-foreground tabular-nums";

  return (
    <div className={`flex items-center gap-0.5 ${className}`} title={title}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={`shrink-0 ${buttonClass}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={ariaLabel ? `Lower ${ariaLabel}` : "Decrease"}
      >
        −
      </Button>
      <span className={valueClass}>{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={`shrink-0 ${buttonClass}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={ariaLabel ? `Raise ${ariaLabel}` : "Increase"}
      >
        +
      </Button>
    </div>
  );
}
