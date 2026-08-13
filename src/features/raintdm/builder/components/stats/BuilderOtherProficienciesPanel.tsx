import { Shield, Sword, Wrench } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useSectionCompletenessHighlight } from "../../context/BuildCompletenessContext";
import { CompletenessHighlightBanner } from "../shared/CompletenessHighlightBanner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { getPendingNamedChoiceGrants } from "@/shared/utils/named-proficiency.parser";
import {
  BuilderNamedPicker,
  BuilderSourceLegend,
  BuilderGrantBadgeList,
} from "./BuilderNamedPicker";

function ProficiencySection({
  icon: Icon,
  label,
  items,
  sources,
  emptyLabel = "None",
}: {
  icon: typeof Shield;
  label: string;
  items: string[];
  sources: Partial<
    Record<string, import("@/shared/types/proficiency.types").ProficiencySource[]>
  >;
  emptyLabel?: string;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </p>
      {items.length > 0 ? (
        <BuilderGrantBadgeList items={items} sources={sources} />
      ) : (
        <p className="text-[11px] text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

export function BuilderOtherProficienciesPanel() {
  const {
    class: selectedClass,
    allToolGrants,
    classToolChoices,
    backgroundToolChoices,
    speciesToolChoices,
    setClassToolChoicesAtIndex,
    setBackgroundToolChoices,
    setSpeciesToolChoices,
    toolSources,
    resolvedToolItems,
    resolvedArmorItems,
    resolvedWeaponItems,
    armorSources,
    weaponSources,
  } = useCharacterBuilder();

  const pending = getPendingNamedChoiceGrants(allToolGrants);
  const speciesGrants = pending.filter((g) => g.source.type === "species");
  const bgGrants = pending.filter((g) => g.source.type === "background");
  const classGrants = pending.filter((g) => g.source.type === "class");
  const hasPickers = pending.length > 0;

  const totalCount =
    resolvedToolItems.length +
    resolvedArmorItems.length +
    resolvedWeaponItems.length;

  const showEquipmentProficiencies = !!selectedClass;
  const hasToolProficiencies = resolvedToolItems.length > 0 || hasPickers;
  const { highlighted, issues: toolIssues } =
    useSectionCompletenessHighlight("tools");

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card",
        highlighted &&
          "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30",
      )}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="other-proficiencies" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" aria-hidden />
              Other Proficiencies
              {totalCount > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
                  {totalCount}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
            {highlighted && <CompletenessHighlightBanner issues={toolIssues} />}
            {showEquipmentProficiencies && (
              <>
                <ProficiencySection
                  icon={Shield}
                  label="Armor"
                  items={resolvedArmorItems}
                  sources={armorSources}
                  emptyLabel="No armor proficiency"
                />
                <ProficiencySection
                  icon={Sword}
                  label="Weapons"
                  items={resolvedWeaponItems}
                  sources={weaponSources}
                  emptyLabel="No weapon proficiency"
                />
              </>
            )}

            {hasToolProficiencies && showEquipmentProficiencies && (
              <div className="my-3 border-t border-border/50" />
            )}

            {hasPickers && <BuilderSourceLegend />}

            {speciesGrants.length > 0 && (
              <BuilderNamedPicker
                grants={speciesGrants}
                chosen={speciesToolChoices}
                onChange={setSpeciesToolChoices}
                label="Species tools"
                pickerSourceType="species"
              />
            )}

            {bgGrants.length > 0 && (
              <BuilderNamedPicker
                grants={bgGrants}
                chosen={backgroundToolChoices}
                onChange={setBackgroundToolChoices}
                label="Background tools"
                pickerSourceType="background"
              />
            )}

            {classGrants.map((grant, grantIndex) => (
              <BuilderNamedPicker
                key={`class-tool-${grantIndex}`}
                grants={[grant]}
                chosen={classToolChoices[grantIndex] ?? []}
                onChange={(items) => setClassToolChoicesAtIndex(grantIndex, items)}
                label={
                  classGrants.length > 1
                    ? `Class tools (${grantIndex + 1}/${classGrants.length})`
                    : "Class tools"
                }
                pickerSourceType="class"
              />
            ))}

            {hasToolProficiencies && (
              <div className={hasPickers || showEquipmentProficiencies ? "mt-2" : undefined}>
                {showEquipmentProficiencies && (
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Wrench className="h-3 w-3" aria-hidden />
                    Tools
                  </p>
                )}
                <BuilderGrantBadgeList items={resolvedToolItems} sources={toolSources} />
              </div>
            )}

            {!showEquipmentProficiencies && !hasToolProficiencies && (
              <p className="py-2 text-center text-[11px] text-muted-foreground">
                Select a Class to see armor and weapon proficiencies, or Species /
                Background for tools.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
