import { ShieldHalf } from "lucide-react";
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
import { getPendingDefenseChoiceGrants } from "@/shared/utils/defense-grant.parser";
import { BuilderSourceLegend } from "./BuilderNamedPicker";
import {
  BuilderDefenseBadgeList,
  BuilderDefensePicker,
} from "./BuilderDefensePicker";

export function BuilderDefensesPanel() {
  const {
    allDefenseGrants,
    speciesDefenseChoices,
    setSpeciesDefenseChoicesAtIndex,
    defenseSources,
    resolvedResistances,
    resolvedImmunities,
  } = useCharacterBuilder();

  const pending = getPendingDefenseChoiceGrants(allDefenseGrants);
  const totalCount = resolvedResistances.length + resolvedImmunities.length;
  const { highlighted, issues: defenseIssues } =
    useSectionCompletenessHighlight("defenses");

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card",
        highlighted &&
          "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30",
      )}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="defenses" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex items-center gap-1.5">
              <ShieldHalf className="h-3.5 w-3.5" aria-hidden />
              Resistances &amp; Immunities
              {totalCount > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
                  {totalCount}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
            {highlighted && <CompletenessHighlightBanner issues={defenseIssues} />}
            {pending.length > 0 && <BuilderSourceLegend />}

            {pending.map((grant, grantIndex) => (
              <BuilderDefensePicker
                key={`defense-${grantIndex}`}
                grants={[grant]}
                chosen={speciesDefenseChoices[grantIndex] ?? []}
                onChange={(types) =>
                  setSpeciesDefenseChoicesAtIndex(grantIndex, types)
                }
                label={
                  pending.length > 1
                    ? `Species defense (${grantIndex + 1}/${pending.length})`
                    : "Species defense"
                }
                pickerSourceType="species"
              />
            ))}

            <div className="mt-2">
              <BuilderDefenseBadgeList
                resistances={resolvedResistances}
                immunities={resolvedImmunities}
                defenseSources={defenseSources}
              />
            </div>

            {totalCount > 0 && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Ring highlight = immunity · badge color = source (Species / Background / Class)
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
