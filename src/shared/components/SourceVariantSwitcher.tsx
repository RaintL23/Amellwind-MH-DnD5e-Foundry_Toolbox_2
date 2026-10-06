import { memo } from "react";
import {
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/dnd/spells/services/book-source.service";
import type { SourceVariant } from "@/shared/types";
import { cn } from "@/shared/utils/cn";

const ACCENT_STYLES = {
  emerald: "border-emerald-500 bg-emerald-500/20 text-emerald-300",
  sky: "border-sky-500 bg-sky-500/20 text-sky-300",
  amber: "border-amber-500 bg-amber-500/20 text-amber-300",
  rose: "border-rose-500 bg-rose-500/20 text-rose-300",
  violet: "border-violet-500 bg-violet-500/20 text-violet-300",
} as const;

export type SourceVariantAccent = keyof typeof ACCENT_STYLES;

const SIZE_STYLES = {
  sm: { label: "text-[10px]", button: "px-2.5 py-1 text-[10px]" },
  md: { label: "text-xs", button: "px-3 py-1.5 text-xs" },
} as const;

interface SourceVariantSwitcherProps<T extends SourceVariant> {
  variants: T[];
  activeId?: string;
  onSelect: (id: string) => void;
  bookNames?: BookSourceNameMap;
  accent?: SourceVariantAccent;
  /** `sm` for the Builder library, `md` for compendium dialogs. */
  size?: keyof typeof SIZE_STYLES;
  showLabel?: boolean;
  className?: string;
  /**
   * When set, inactive variants that differ from another variant get a
   * "Differs from other sources" dot (spells, items, classes).
   */
  differs?: (a: T, b: T) => boolean;
}

/** Single source-book switcher shared by compendium dialogs and the Builder. */
function SourceVariantSwitcherInner<T extends SourceVariant>({
  variants,
  activeId,
  onSelect,
  bookNames = {},
  accent = "emerald",
  size = "sm",
  showLabel = true,
  className,
  differs,
}: SourceVariantSwitcherProps<T>) {
  if (variants.length <= 1) return null;

  const activeAccent = ACCENT_STYLES[accent];
  const sizeStyles = SIZE_STYLES[size];

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <p
          className={cn(
            "font-semibold uppercase tracking-wide text-muted-foreground",
            sizeStyles.label,
          )}
        >
          Source
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {variants.map((variant) => {
          const isActive = variant.id === activeId;
          const sourceTitle = resolveBookSourceName(bookNames, variant.source);
          const differsFromOthers =
            !isActive &&
            !!differs &&
            variants.some(
              (other) => other.id !== variant.id && differs(variant, other),
            );

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              title={sourceTitle !== variant.source ? sourceTitle : undefined}
              className={cn(
                "rounded-md border font-medium transition-colors",
                sizeStyles.button,
                isActive
                  ? activeAccent
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {variant.source}
              {variant.page !== undefined && (
                <span className="ml-1 opacity-70">p.{variant.page}</span>
              )}
              {differsFromOthers && (
                <span
                  className="ml-1 text-amber-400"
                  title="Differs from other sources"
                >
                  •
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SourceVariantSwitcher = memo(
  SourceVariantSwitcherInner,
) as typeof SourceVariantSwitcherInner;
