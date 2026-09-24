import { useState } from "react";
import { Check, Swords } from "lucide-react";
import type { BookSourceNameMap } from "@/shared/services/source-catalog.service";
import type { RpgbotLookupFn } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { RpgbotRatingBadge } from "@/features/raintdm/builder/components/shared/RpgbotRatingBadge";
import { resolveBookSourceName } from "@/features/dnd/spells/services/book-source.service";
import {
  getFeatCategoryLabel,
  type OptionalFeatureCatalogItem,
} from "@/features/raintdm/builder/utils/class-optional-features.utils";
import { RPGBOT_ROW_ACCENT } from "@/features/raintdm/builder/utils/library-variant.utils";
import type { BuilderOptionalFeatureSelection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  LibraryInfoButton,
  LibraryItemBadge,
  LibraryItemBadgeRow,
  LibraryRowDetails,
} from "../library/shared/LibraryUi";
import { OptionalFeatureLibraryDetail } from "../library/OptionalFeatureLibraryDetail";
import { normalizeName } from "./optional-feature-library.utils";

interface OptionalFeatureCatalogListProps {
  items: OptionalFeatureCatalogItem[];
  bookNames: BookSourceNameMap;
  usesFeatCatalog: boolean;
  isFightingStyle: boolean;
  otherFightingStylePicks: BuilderOptionalFeatureSelection[];
  rpgbotOptionalLookup: RpgbotLookupFn | null;
  rpgbotOptionalReady: boolean;
  isPicked: (item: OptionalFeatureCatalogItem) => boolean;
  canAdd: (item: OptionalFeatureCatalogItem) => boolean;
  onToggle: (item: OptionalFeatureCatalogItem) => void;
}

export function OptionalFeatureCatalogList({
  items,
  bookNames,
  usesFeatCatalog,
  isFightingStyle,
  otherFightingStylePicks,
  rpgbotOptionalLookup,
  rpgbotOptionalReady,
  isPicked,
  canAdd,
  onToggle,
}: OptionalFeatureCatalogListProps) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-xs italic text-muted-foreground">
        No options in the catalog for this progression.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const selected = isPicked(item);
        const addable = canAdd(item);
        const disabled = !selected && !addable;
        const disabledHint =
          !addable && !selected
            ? isFightingStyle &&
              otherFightingStylePicks.some(
                (p) => normalizeName(p.name) === normalizeName(item.name),
              )
              ? "You already selected this fighting style in another slot"
              : "Not available"
            : undefined;
        const sourceTitle = resolveBookSourceName(bookNames, item.source);
        const categoryLabel =
          item.catalog === "feat"
            ? getFeatCategoryLabel(item.category)
            : item.featureTypes[0];
        const rpgbotRating = rpgbotOptionalReady
          ? (rpgbotOptionalLookup?.(item.name, item.source) ?? null)
          : null;
        const expanded = expandedIds.has(item.id);

        return (
          <li key={item.id}>
            <div
              className={cn(
                "rounded-md border border-l-2 transition-colors",
                rpgbotRating
                  ? RPGBOT_ROW_ACCENT[rpgbotRating.rating]
                  : "border-l-transparent",
                selected
                  ? "border-violet-400/40 bg-violet-400/5"
                  : "border-border/60",
                !disabled && !expanded && "hover:bg-muted/40",
              )}
            >
              <div className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  disabled={disabled}
                  title={disabled ? disabledHint : undefined}
                  className={cn(
                    "min-w-0 flex-1 px-2 py-1.5 text-left text-xs",
                    disabled
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer",
                  )}
                >
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <Swords
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        selected ? "text-amber-400" : "text-muted-foreground",
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                    {rpgbotRating && (
                      <RpgbotRatingBadge rating={rpgbotRating} />
                    )}
                    {selected && (
                      <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                    )}
                  </div>
                  <LibraryItemBadgeRow>
                    {categoryLabel && (
                      <LibraryItemBadge variant="category">
                        {categoryLabel}
                      </LibraryItemBadge>
                    )}
                    {item.consumes && (
                      <LibraryItemBadge>{item.consumes}</LibraryItemBadge>
                    )}
                    {item.isRepeatable && (
                      <LibraryItemBadge>Repeatable</LibraryItemBadge>
                    )}
                    {usesFeatCatalog ? (
                      <LibraryItemBadge variant="category">
                        Feat
                      </LibraryItemBadge>
                    ) : item.catalog === "feature-choice" ? (
                      <LibraryItemBadge variant="category">
                        Class Feature
                      </LibraryItemBadge>
                    ) : (
                      <LibraryItemBadge variant="category">
                        Optional Feature
                      </LibraryItemBadge>
                    )}
                  </LibraryItemBadgeRow>
                </button>

                <div className="flex shrink-0 items-center gap-1.5 py-1.5 pr-2">
                  {selected && (
                    <span className="text-[10px] text-muted-foreground">
                      Selected
                    </span>
                  )}
                  <span
                    className="rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    title={sourceTitle}
                  >
                    {item.source}
                  </span>
                  <LibraryInfoButton
                    label={item.name}
                    expanded={expanded}
                    onClick={() => toggleExpanded(item.id)}
                  />
                </div>
              </div>
              {expanded && (
                <LibraryRowDetails className="mt-0 pb-2 pl-7 pr-2">
                  <OptionalFeatureLibraryDetail
                    item={item}
                    bookNames={bookNames}
                    inline
                  />
                </LibraryRowDetails>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
