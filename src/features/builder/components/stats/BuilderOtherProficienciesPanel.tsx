import { Wrench } from "lucide-react";
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

export function BuilderOtherProficienciesPanel() {
  const {
    allToolGrants,
    classToolChoices,
    backgroundToolChoices,
    speciesToolChoices,
    setClassToolChoicesAtIndex,
    setBackgroundToolChoices,
    setSpeciesToolChoices,
    toolSources,
    resolvedToolItems,
  } = useCharacterBuilder();

  const pending = getPendingNamedChoiceGrants(allToolGrants);
  const speciesGrants = pending.filter((g) => g.source.type === "species");
  const bgGrants = pending.filter((g) => g.source.type === "background");
  const classGrants = pending.filter((g) => g.source.type === "class");
  const hasPickers = pending.length > 0;

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <Accordion type="single" collapsible>
        <AccordionItem value="other-proficiencies" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" aria-hidden />
              Other Proficiencies
              {resolvedToolItems.length > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
                  {resolvedToolItems.length}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
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

            <div className="mt-2">
              <BuilderGrantBadgeList items={resolvedToolItems} sources={toolSources} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
