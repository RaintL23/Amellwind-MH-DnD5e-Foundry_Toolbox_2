import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BookSourceNameMap } from "@/features/spells/services/book-source.service";
import { SourceVariantSwitcher } from "@/features/builder/components/shared/SourceVariantSwitcher";
import type { SourceVariant } from "@/features/builder/utils/library-variant.utils";
import {
  FeatParagraphList,
  FeatSectionBlock,
} from "@/features/dnd-feats/components/DndFeatContent";
import type { DndFeat, Feat } from "@/shared/types";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types";

interface FeatLibraryDetailProps {
  feat: Feat | DndFeat;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  bookNames?: BookSourceNameMap;
}

export function FeatLibraryDetail({
  feat,
  sourceVariants,
  activeSourceId,
  onSourceSelect,
  bookNames = {},
}: FeatLibraryDetailProps) {
  const categoryLabel =
    "category" in feat && feat.category
      ? (DND_FEAT_CATEGORY_LABELS[feat.category] ?? feat.category)
      : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Award className="h-4 w-4 text-rose-400" />
        <h3 className="text-sm font-semibold text-foreground">{feat.name}</h3>
        {categoryLabel && (
          <Badge variant="secondary" className="text-[10px]">
            {categoryLabel}
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground">
          {feat.source}
          {feat.page !== undefined ? ` p.${feat.page}` : ""}
        </span>
      </div>

      {sourceVariants && onSourceSelect && (
        <SourceVariantSwitcher
          variants={sourceVariants}
          activeId={activeSourceId}
          onSelect={onSourceSelect}
          bookNames={bookNames}
          accent="rose"
        />
      )}

      {feat.summary && (
        <p className="text-xs italic leading-relaxed text-muted-foreground">
          {feat.summary}
        </p>
      )}

      {feat.prerequisites.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground/80">
            Prerequisites:
          </span>{" "}
          {feat.prerequisites.join("; ")}
        </p>
      )}

      <Separator />

      <FeatParagraphList lines={feat.paragraphs} />
      {feat.sections.map((section, i) => (
        <FeatSectionBlock key={section.name ?? i} section={section} />
      ))}
    </div>
  );
}
