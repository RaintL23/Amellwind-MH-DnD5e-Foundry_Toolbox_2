import { memo } from "react";
import { Class } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  resolveBookSourceName,
  type BookSourceNameMap,
} from "@/features/spells/services/book-source.service";
import {
  getFieldsDifferentFromVariant,
  type ClassVariantField,
} from "../../utils/class-variant.utils";

interface ClassSourceSwitcherProps {
  variants: Class[];
  activeId: string;
  onSelect: (id: string) => void;
  varyingFields: ClassVariantField[];
  bookNames: BookSourceNameMap;
}

export const ClassSourceSwitcher = memo(function ClassSourceSwitcher({
  variants,
  activeId,
  onSelect,
  varyingFields,
  bookNames,
}: ClassSourceSwitcherProps) {
  if (variants.length <= 1) return null;

  const hasDiffs = varyingFields.length > 0;

  return (
    <div className="space-y-1.5">
      {/* <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Source
      </p> */}
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const isActive = v.id === activeId;
          const differsFromOthers =
            hasDiffs &&
            variants.some(
              (other) =>
                other.id !== v.id &&
                getFieldsDifferentFromVariant(v, other).length > 0,
            );
          const sourceTitle = resolveBookSourceName(bookNames, v.source);

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              title={sourceTitle !== v.source ? sourceTitle : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-sky-500 bg-sky-500/20 text-sky-300"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {v.source}
              {v.page !== undefined && (
                <span className="ml-1 opacity-70">p.{v.page}</span>
              )}
              {!isActive && differsFromOthers && (
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
});
