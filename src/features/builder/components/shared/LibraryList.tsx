import { resolveBookSourceName } from "@/features/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  formatVariantSourcesLabel,
  isLibraryOptionSelected,
  type LibraryListOption,
} from "../../utils/library-variant.utils";

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>
  );
}

export function LibraryList({
  loading,
  options,
  selectedId,
  selectedName = null,
  icon,
  stats,
  getDisabledReason,
  onSelect,
}: {
  loading: boolean;
  options: LibraryListOption[];
  selectedId: string | null;
  selectedName?: string | null;
  icon: React.ReactNode;
  stats?: (option: LibraryListOption) => string;
  getDisabledReason?: (option: LibraryListOption) => string | null;
  onSelect: (id: string, name: string) => void;
}) {
  const bookNames = useBookSourceNames();

  if (loading) return <EmptyState text="Loading..." />;
  if (options.length === 0) return <EmptyState text="No results." />;

  return (
    <>
      {options.map((option) => {
        const variantTrailing = option.variantSources?.length
          ? formatVariantSourcesLabel(option.variantSources)
          : null;
        const sourceLabel =
          !variantTrailing && option.source
            ? resolveBookSourceName(bookNames, option.source)
            : undefined;
        const rowStats = stats?.(option) ?? "";
        const isSelected = isLibraryOptionSelected(
          option,
          selectedId,
          selectedName,
        );
        const disabledReason =
          !isSelected && getDisabledReason
            ? getDisabledReason(option)
            : null;

        return (
          <button
            key={option.id}
            type="button"
            disabled={!!disabledReason}
            title={disabledReason ?? undefined}
            onClick={() => onSelect(option.id, option.name)}
            className={cn(
              "mb-1 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
              isSelected
                ? "border-violet-400/40 bg-violet-400/5"
                : "border-border/60",
              disabledReason
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-muted/50",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 font-medium text-foreground">
                {icon}
                <span className="truncate">{option.name}</span>
                {isLibraryOptionSelected(option, selectedId, selectedName) && (
                  <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                )}
              </div>
              {rowStats && (
                <div className="truncate pl-5 text-[11px] text-muted-foreground">
                  {rowStats}
                </div>
              )}
            </div>
            {(variantTrailing?.label ?? sourceLabel) && (
              <span
                className="ml-2 max-w-[16rem] shrink-0 text-[10px] text-muted-foreground"
                title={
                  variantTrailing?.title ??
                  (sourceLabel && option.source && sourceLabel !== option.source
                    ? option.source
                    : undefined)
                }
              >
                {variantTrailing?.label ?? sourceLabel}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}
