import { Sparkles } from "lucide-react";
import type { BookSourceNameMap } from "@/features/spells/services/book-source.service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClassFeatureDetailsPanel } from "@/features/classes/components/detail/ClassFeatureDetailsPanel";
import { SourceVariantSwitcher } from "@/features/builder/components/shared/SourceVariantSwitcher";
import type { SourceVariant } from "@/features/builder/utils/library-variant.utils";
import type { Subclass } from "@/shared/types";
import { EmptyState } from "./LibraryUi";

export function SubclassLibraryDetail({
  subclass,
  level,
  sourceVariants,
  activeSourceId,
  onSourceSelect,
  bookNames = {},
}: {
  subclass: Subclass;
  level: number;
  sourceVariants?: SourceVariant[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  bookNames?: BookSourceNameMap;
}) {
  const rowsWithFeatures = subclass.progression.filter(
    (row) => row.level <= level && row.features.length > 0,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-foreground">
          {subclass.name}
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {subclass.source}
        </span>
      </div>

      {sourceVariants && onSourceSelect && (
        <SourceVariantSwitcher
          variants={sourceVariants}
          activeId={activeSourceId}
          onSelect={onSourceSelect}
          bookNames={bookNames}
          accent="emerald"
        />
      )}

      {rowsWithFeatures.length > 0 ? (
        <Accordion type="multiple" className="space-y-1">
          {rowsWithFeatures.map((row) => (
            <AccordionItem
              key={row.level}
              value={`subclass-level-${row.level}`}
              className="rounded-md border border-border/60 px-2"
            >
              <AccordionTrigger className="gap-2 py-2 text-xs font-medium hover:no-underline">
                <span className="shrink-0 font-semibold text-emerald-400/90">
                  Level {row.level}
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-[10px] font-normal text-muted-foreground">
                  {row.features.map((f) => f.displayName).join(", ")}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2 pt-0">
                <ClassFeatureDetailsPanel
                  features={row.features.map((f) => ({
                    ...f,
                    isSubclassFeature: true,
                  }))}
                  className="mt-0"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <EmptyState text="Sin rasgos de subclass disponibles para este nivel." />
      )}
    </div>
  );
}
