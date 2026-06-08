import { memo, type ReactNode } from "react";
import {
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import type { SourceVariant } from "../../utils/library-variant.utils";
import { cn } from "@/shared/utils/cn";

const ACCENT_STYLES = {
  emerald:
    "border-emerald-500 bg-emerald-500/20 text-emerald-300",
  sky: "border-sky-500 bg-sky-500/20 text-sky-300",
  amber: "border-amber-500 bg-amber-500/20 text-amber-300",
  rose: "border-rose-500 bg-rose-500/20 text-rose-300",
} as const;

export type SourceVariantAccent = keyof typeof ACCENT_STYLES;

interface SourceVariantSwitcherProps {
  variants: SourceVariant[];
  activeId?: string;
  onSelect: (id: string) => void;
  bookNames?: BookSourceNameMap;
  accent?: SourceVariantAccent;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
  renderBadgeExtra?: (variant: SourceVariant, isActive: boolean) => ReactNode;
}

export const SourceVariantSwitcher = memo(function SourceVariantSwitcher({
  variants,
  activeId,
  onSelect,
  bookNames = {},
  accent = "emerald",
  size = "sm",
  showLabel = true,
  className,
  renderBadgeExtra,
}: SourceVariantSwitcherProps) {
  if (variants.length <= 1) return null;

  const activeAccent = ACCENT_STYLES[accent];
  const buttonSize =
    size === "md"
      ? "rounded-md px-3 py-1.5 text-xs"
      : "rounded-md px-2.5 py-1 text-[10px]";

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Source
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {variants.map((variant) => {
          const isActive = variant.id === activeId;
          const sourceTitle = resolveBookSourceName(bookNames, variant.source);

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              title={sourceTitle !== variant.source ? sourceTitle : undefined}
              className={cn(
                "border font-medium transition-colors",
                buttonSize,
                isActive
                  ? activeAccent
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {variant.source}
              {variant.page !== undefined && (
                <span className="ml-1 opacity-70">p.{variant.page}</span>
              )}
              {renderBadgeExtra?.(variant, isActive)}
            </button>
          );
        })}
      </div>
    </div>
  );
});
