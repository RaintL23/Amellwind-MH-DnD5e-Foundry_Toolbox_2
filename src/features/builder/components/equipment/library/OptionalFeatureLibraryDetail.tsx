import { Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BookSourceNameMap } from "@/features/spells/services/book-source.service";
import { SourceVariantSwitcher } from "@/features/builder/components/shared/SourceVariantSwitcher";
import type { SourceVariant } from "@/features/builder/utils/library-variant.utils";
import {
  getFeatCategoryLabel,
  type OptionalFeatureCatalogItem,
} from "@/features/builder/utils/class-optional-features.utils";
import { DndRichText } from "@/shared/components/DndRichText";

interface OptionalFeatureLibraryDetailProps {
  item: OptionalFeatureCatalogItem;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  bookNames?: BookSourceNameMap;
}

export function OptionalFeatureLibraryDetail({
  item,
  sourceVariants,
  activeSourceId,
  onSourceSelect,
  bookNames = {},
}: OptionalFeatureLibraryDetailProps) {
  const categoryLabel =
    item.catalog === "feat"
      ? getFeatCategoryLabel(item.category)
      : item.featureTypes[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Swords className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
        {categoryLabel && (
          <Badge variant="secondary" className="text-[10px]">
            {categoryLabel}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px]">
          {item.source}
          {item.page !== undefined ? ` p.${item.page}` : ""}
        </Badge>
        {item.consumes && (
          <Badge variant="outline" className="text-[10px]">
            {item.consumes}
          </Badge>
        )}
        {item.isRepeatable && (
          <Badge variant="outline" className="text-[10px]">
            Repetible
          </Badge>
        )}
      </div>

      {sourceVariants && onSourceSelect && (
        <SourceVariantSwitcher
          variants={sourceVariants}
          activeId={activeSourceId}
          onSelect={onSourceSelect}
          bookNames={bookNames}
          accent="amber"
        />
      )}

      {item.prerequisiteSummary && (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">
            Requisitos:
          </span>{" "}
          {item.prerequisiteSummary}
        </p>
      )}

      <Separator />

      <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
        {item.entries.map((line, i) => (
          <DndRichText key={i} text={line} />
        ))}
      </div>
    </div>
  );
}
