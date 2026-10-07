import { ChevronRight } from "lucide-react";
import { Class, Subclass } from "@/shared/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { type BookSourceNameMap } from "@/features/dnd/spells/services/book-source.service";
import { cn } from "@/shared/utils/cn";
import { getCasterLabel } from "../../mappers/class.mapper";
import { hasClassMetaListContent } from "../../utils/class-meta-list.utils";
import { type ClassVariantField } from "../../utils/class-variant.utils";
import { ClassMetaRow } from "./ClassMetaRow";
import { ClassMetaListSection } from "./ClassMetaListSection";
import { ClassSubclassSelector } from "./ClassSubclassSelector";

interface ClassDetailMetaSectionProps {
  active: Class;
  variantSubclasses: Subclass[];
  differs: (field: ClassVariantField) => boolean;
  activeSubclassId: string;
  onSubclassSelect: (id: string) => void;
  bookNames: BookSourceNameMap;
}

const CARD = "rounded-md border border-border bg-muted/20 p-3 @lg/classdetail:p-4";
const CARD_HEADING =
  "mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function ClassDetailMetaSection({
  active,
  variantSubclasses,
  differs,
  activeSubclassId,
  onSubclassSelect,
  bookNames,
}: ClassDetailMetaSectionProps) {
  const hasStartingInfo =
    hasClassMetaListContent(active.startingProficiencies) ||
    hasClassMetaListContent(undefined, active.startingEquipment);
  const hasMulticlassing = active.multiclassing.length > 0;
  const multiclassDiffers = differs("multiclassing");

  return (
    <div
      className={cn(
        "grid gap-3 @4xl/classdetail:gap-4",
        hasStartingInfo &&
          "@4xl/classdetail:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
      )}
    >
      <div className={cn(CARD, "space-y-4")}>
        <div>
          <h3 className={CARD_HEADING}>Core traits</h3>
          <dl
            className={cn(
              "grid grid-cols-2 gap-2 @lg/classdetail:grid-cols-4",
              hasStartingInfo && "@4xl/classdetail:grid-cols-2",
            )}
          >
            <ClassMetaRow
              label="Hit Die"
              value={active.hitDie}
              differs={differs("hitDie")}
            />
            <ClassMetaRow
              label="Saving Throws"
              value={active.proficiencies.join(", ") || "—"}
              differs={differs("proficiencies")}
            />
            <ClassMetaRow
              label="Spellcasting"
              value={getCasterLabel(active.casterProgression)}
              differs={differs("casterProgression")}
            />
            {active.spellcastingAbility && (
              <ClassMetaRow
                label="Spell Ability"
                value={active.spellcastingAbility}
                differs={differs("spellcastingAbility")}
              />
            )}
          </dl>
        </div>

        <ClassSubclassSelector
          subclasses={variantSubclasses}
          activeSubclassId={activeSubclassId}
          onSelect={onSubclassSelect}
          subclassTitle={active.subclassTitle}
          bookNames={bookNames}
          countDiffers={differs("subclassCount")}
        />

        {hasMulticlassing && (
          <Collapsible className="border-t border-border/60 pt-3">
            <CollapsibleTrigger
              className={cn(
                "group flex w-full items-center gap-1.5 rounded text-left text-xs font-semibold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                multiclassDiffers
                  ? "text-amber-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
              Multiclassing
              {multiclassDiffers && (
                <span className="text-[10px] font-normal normal-case text-amber-500/80">
                  (varies)
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-muted-foreground">
                {active.multiclassing.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {hasStartingInfo && (
        <div className={cn(CARD, "space-y-4")}>
          <ClassMetaListSection
            heading="Starting Proficiencies"
            groups={active.startingProficiencies}
            differs={differs("startingProficiencies")}
          />
          <ClassMetaListSection
            heading="Starting Equipment"
            items={active.startingEquipment}
            differs={differs("startingEquipment")}
          />
        </div>
      )}
    </div>
  );
}
