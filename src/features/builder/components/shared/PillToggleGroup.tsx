import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

/**
 * Shared pill/badge styling for the builder's small single-select rows
 * (identity/feat source selectors, rarity filter, …). Centralising it keeps the
 * pill look consistent and removes the near-identical markup that was copied
 * across those components.
 */
const PILL_BASE =
  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors";
const PILL_INACTIVE =
  "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground";
const PILL_ACTIVE_DEFAULT = "border-primary bg-primary/15 text-primary";

export interface PillToggleOption<T extends string> {
  id: T;
  label: ReactNode;
  disabled?: boolean;
  /** Native tooltip shown on hover. */
  title?: string;
  /** Replaces the group's active classes for this option (e.g. rarity colors). */
  activeClassName?: string;
  /** Extra classes applied only while this option is inactive (e.g. dimmed badge). */
  inactiveClassName?: string;
}

interface PillToggleGroupProps<T extends string> {
  options: ReadonlyArray<PillToggleOption<T>>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
  /** Active classes used for options without their own `activeClassName`. */
  activeClassName?: string;
}

export function PillToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  activeClassName = PILL_ACTIVE_DEFAULT,
}: PillToggleGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-1 normal-case", className)}>
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            disabled={option.disabled}
            title={option.title}
            onClick={() => onChange(option.id)}
            className={cn(
              PILL_BASE,
              isActive
                ? option.activeClassName ?? activeClassName
                : cn(PILL_INACTIVE, option.inactiveClassName),
              option.disabled && "cursor-not-allowed opacity-45",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
