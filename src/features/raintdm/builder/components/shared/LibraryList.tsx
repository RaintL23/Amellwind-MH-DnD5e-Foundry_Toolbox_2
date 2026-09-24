import { resolveBookSourceName } from "@/features/dnd/spells/services/book-source.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/shared/utils/cn";
import {
  formatVariantSourcesLabel,
  isLibraryOptionSelected,
  RPGBOT_ROW_ACCENT,
  sortLibraryOptionsByRpgbot,
  type LibraryListOption,
} from "../../utils/library-variant.utils";
import { RpgbotRatingBadge } from "./RpgbotRatingBadge";
import { LibraryInfoButton, LibraryRowDetails } from "./LibraryInfoButton";

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>
  );
}

function LibraryListRow({
  option,
  icon,
  isSelected,
  rowStats,
  disabledReason,
  trailingLabel,
  trailingTitle,
  onSelect,
  renderDetails,
}: {
  option: LibraryListOption;
  icon: React.ReactNode;
  isSelected: boolean;
  rowStats: string;
  disabledReason: string | null;
  trailingLabel?: string;
  trailingTitle?: string;
  onSelect: (id: string, name: string) => void;
  renderDetails?: (option: LibraryListOption) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "mb-1 w-full rounded-md border border-l-2 px-2 py-1.5 text-xs transition-colors",
        option.rpgbot
          ? RPGBOT_ROW_ACCENT[option.rpgbot.rating]
          : "border-l-transparent",
        isSelected
          ? "border-violet-400/40 bg-violet-400/5"
          : "border-border/60",
        disabledReason && !expanded && "opacity-40",
        !disabledReason && !expanded && "hover:bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!!disabledReason}
          title={disabledReason ?? undefined}
          onClick={() => onSelect(option.id, option.name)}
          className={cn(
            "min-w-0 flex-1 text-left",
            disabledReason ? "cursor-not-allowed" : "cursor-pointer",
            disabledReason && expanded && "opacity-40",
          )}
        >
          <div className="flex items-center gap-1 font-medium text-foreground">
            {icon}
            <span className="truncate">{option.name}</span>
            {option.rpgbot && <RpgbotRatingBadge rating={option.rpgbot} />}
            {isSelected && (
              <Check className="h-3 w-3 shrink-0 text-emerald-400" />
            )}
          </div>
          {rowStats && (
            <div className="truncate pl-5 text-[11px] text-muted-foreground">
              {rowStats}
            </div>
          )}
          {disabledReason && (
            <div className="pl-5 text-[10px] leading-snug text-amber-500">
              {disabledReason}
            </div>
          )}
        </button>
        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          {trailingLabel && (
            <span
              className="max-w-[16rem] shrink-0 text-[10px] text-muted-foreground"
              title={trailingTitle}
            >
              {trailingLabel}
            </span>
          )}
          {renderDetails && (
            <LibraryInfoButton
              label={option.name}
              expanded={expanded}
              onClick={() => setExpanded((prev) => !prev)}
            />
          )}
        </div>
      </div>
      {expanded && renderDetails && (
        <LibraryRowDetails>{renderDetails(option)}</LibraryRowDetails>
      )}
    </div>
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
  renderDetails,
}: {
  loading: boolean;
  options: LibraryListOption[];
  selectedId: string | null;
  selectedName?: string | null;
  icon: React.ReactNode;
  stats?: (option: LibraryListOption) => string;
  getDisabledReason?: (option: LibraryListOption) => string | null;
  onSelect: (id: string, name: string) => void;
  /** Details shown inline (accordion) under the row, without selecting it. */
  renderDetails?: (option: LibraryListOption) => React.ReactNode;
}) {
  const bookNames = useBookSourceNames();
  const sortedOptions = useMemo(
    () => sortLibraryOptionsByRpgbot(options),
    [options],
  );

  if (loading) return <EmptyState text="Loading..." />;
  if (sortedOptions.length === 0) return <EmptyState text="No results." />;

  return (
    <>
      {sortedOptions.map((option) => {
        const variantTrailing = option.variantSources?.length
          ? formatVariantSourcesLabel(option.variantSources)
          : null;
        const sourceLabel =
          !variantTrailing && option.source
            ? resolveBookSourceName(bookNames, option.source)
            : undefined;
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
          <LibraryListRow
            key={option.id}
            option={option}
            icon={icon}
            isSelected={isSelected}
            rowStats={stats?.(option) ?? ""}
            disabledReason={disabledReason}
            trailingLabel={variantTrailing?.label ?? sourceLabel}
            trailingTitle={
              variantTrailing?.title ??
              (sourceLabel && option.source && sourceLabel !== option.source
                ? option.source
                : undefined)
            }
            onSelect={onSelect}
            renderDetails={renderDetails}
          />
        );
      })}
    </>
  );
}
