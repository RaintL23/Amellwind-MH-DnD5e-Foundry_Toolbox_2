import { GraduationCap } from "lucide-react";
import type { Class, ClassFeatureEntry, Subclass } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClassFeatureDetailsPanel } from "@/features/classes/components/detail/ClassFeatureDetailsPanel";
import { ClassSourceSwitcher } from "@/features/classes/components/detail/ClassSourceSwitcher";
import { getCasterLabel } from "@/features/classes/mappers/class.mapper";
import { hasStartingEquipmentOffers } from "@/shared/utils/starting-equipment.parser";
import { StartingEquipmentPicker } from "./StartingEquipmentPicker";
import type { BookSourceNameMap } from "@/features/spells/services/book-source.service";
import type { ClassVariantField } from "@/features/classes/utils/class-variant.utils";
import {
  getFeaturesUpToLevel,
  getSubclassGainLevel,
} from "../../utils/builder-class.utils";

interface ClassLibraryDetailProps {
  classData: Class;
  subclass: Subclass | null;
  level: number;
  variants?: Class[];
  varyingFields?: ClassVariantField[];
  bookNames?: BookSourceNameMap;
  onSourceSelect?: (id: string) => void;
}

function groupFeaturesByLevel(
  features: ClassFeatureEntry[],
): Map<number, ClassFeatureEntry[]> {
  const map = new Map<number, ClassFeatureEntry[]>();
  for (const feature of features) {
    const group = map.get(feature.level) ?? [];
    group.push(feature);
    map.set(feature.level, group);
  }
  return map;
}

function levelFeatureSummary(features: ClassFeatureEntry[]): string {
  return features.map((f) => f.displayName).join(", ");
}

export function ClassLibraryDetail({
  classData,
  subclass,
  level,
  variants = [],
  varyingFields = [],
  bookNames = {},
  onSourceSelect,
}: ClassLibraryDetailProps) {
  const features = getFeaturesUpToLevel(classData, subclass, level);
  const byLevel = groupFeaturesByLevel(features);
  const subclassLevel = getSubclassGainLevel(classData);
  const sortedLevels = [...byLevel.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <GraduationCap className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">{classData.name}</h3>
        <Badge variant="secondary" className="text-[10px]">
          {classData.source}
        </Badge>
        {classData.edition && (
          <Badge variant="secondary" className="text-[10px]">
            {classData.edition === "one" ? "2024" : "2014"}
          </Badge>
        )}
        <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/50 text-[10px]">
          Level {level}
        </Badge>
      </div>

      {onSourceSelect && variants.length > 1 && (
        <ClassSourceSwitcher
          variants={variants}
          activeId={classData.id}
          onSelect={onSourceSelect}
          varyingFields={varyingFields}
          bookNames={bookNames}
        />
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          <span className="font-medium text-foreground/80">Hit Die:</span>{" "}
          {classData.hitDie}
        </span>
        <span>
          <span className="font-medium text-foreground/80">Spellcasting:</span>{" "}
          {getCasterLabel(classData.casterProgression)}
        </span>
      </div>

      {subclass && (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-emerald-400/90">
            {classData.subclassTitle ?? "Subclass"}:
          </span>{" "}
          {subclass.name}
        </p>
      )}

      {!subclass && subclassLevel !== null && level >= subclassLevel && (
        <p className="text-[11px] italic text-muted-foreground">
          Elige una {classData.subclassTitle?.toLowerCase() ?? "subclass"} para
          ver sus rasgos.
        </p>
      )}

      {hasStartingEquipmentOffers(classData.startingEquipmentOffers) && (
        <StartingEquipmentPicker
          offers={classData.startingEquipmentOffers}
          source={{
            type: "class",
            id: classData.id,
            name: classData.name,
          }}
        />
      )}

      <Separator />

      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
        Class Features (levels 1–{level})
      </h4>

      {byLevel.size === 0 ? (
        <p className="text-xs italic text-muted-foreground">
          No hay rasgos disponibles para este nivel.
        </p>
      ) : (
        <Accordion type="multiple" className="space-y-1">
          {sortedLevels.map(([featLevel, levelFeatures]) => (
            <AccordionItem
              key={featLevel}
              value={`level-${featLevel}`}
              className="rounded-md border border-border/60 px-2"
            >
              <AccordionTrigger className="gap-2 py-2 text-xs font-medium hover:no-underline">
                <span className="shrink-0 font-semibold text-violet-400/90">
                  Level {featLevel}
                </span>
                <span className="min-w-0 flex-1 truncate text-left text-[10px] font-normal text-muted-foreground">
                  {levelFeatureSummary(levelFeatures)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2 pt-0">
                <ClassFeatureDetailsPanel
                  features={levelFeatures}
                  className="mt-0"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
