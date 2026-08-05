import { Swords } from "lucide-react";
import type { BookSourceNameMap } from "@/shared/services/source-catalog.service";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import { resolveBookSourceName } from "@/features/spells/services/book-source.service";
import {
  getFeatCategoryLabel,
  type OptionalFeatureCatalogItem,
} from "@/features/builder/utils/class-optional-features.utils";
import type { BuilderOptionalFeatureSelection } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  ItemRow,
  LibraryItemBadge,
  LibraryItemBadgeRow,
} from "../library/shared/LibraryUi";
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
  onViewDetail: (item: OptionalFeatureCatalogItem) => void;
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
  onViewDetail,
}: OptionalFeatureCatalogListProps) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-xs italic text-muted-foreground">
        No options in the catalog for this progression.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const selected = isPicked(item);
        const addable = canAdd(item);
        const sourceBadge = {
          code: item.source,
          title: resolveBookSourceName(bookNames, item.source),
        };
        const categoryLabel =
          item.catalog === "feat"
            ? getFeatCategoryLabel(item.category)
            : item.featureTypes[0];
        const rpgbotRating = rpgbotOptionalReady
          ? (rpgbotOptionalLookup?.(item.name, item.source) ?? null)
          : null;

        return (
          <li key={item.id}>
            <ItemRow
              icon={
                <Swords
                  className={cn(
                    "h-3.5 w-3.5",
                    selected ? "text-amber-400" : "text-muted-foreground",
                  )}
                />
              }
              name={item.name}
              rpgbotRating={rpgbotRating}
              source={sourceBadge}
              equipped={selected}
              disabled={!selected && !addable}
              disabledHint={
                !addable && !selected
                  ? isFightingStyle &&
                    otherFightingStylePicks.some(
                      (p) =>
                        normalizeName(p.name) === normalizeName(item.name),
                    )
                    ? "You already selected this fighting style in another slot"
                    : "Not available"
                  : undefined
              }
              onClick={() => onToggle(item)}
              meta={
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
                    <LibraryItemBadge variant="category">Feat</LibraryItemBadge>
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
              }
              trailing={selected ? "Selected" : undefined}
            />
            <button
              type="button"
              onClick={() => onViewDetail(item)}
              className="mb-1 ml-5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              View detail
            </button>
          </li>
        );
      })}
    </ul>
  );
}
