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

function excludeChosenItems(
  items: string[],
  ...choiceLists: Array<string[] | undefined>
): string[] {
  const excluded = new Set(
    choiceLists.flatMap((list) => (list ?? []).map((item) => item.toLowerCase())),
  );
  if (!excluded.size) return items;
  return items.filter((item) => !excluded.has(item.toLowerCase()));
}

function CategoryHeading({
  icon: Icon,
  label,
}: {
  icon: typeof Shield;
  label: string;
}) {
  return (
    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </p>
  );
}

export function BuilderOtherProficienciesPanel() {
  const {
    class: selectedClass,
    allToolGrants,
    allWeaponGrants,
    classToolChoices,
    backgroundToolChoices,
    speciesToolChoices,
    speciesWeaponChoices,
    setClassToolChoicesAtIndex,
    setBackgroundToolChoices,
    setSpeciesToolChoices,
    setSpeciesWeaponChoices,
    toolSources,
    resolvedToolItems,
    resolvedArmorItems,
    resolvedWeaponItems,
    armorSources,
    weaponSources,
  } = useCharacterBuilder();

  const pendingTools = getPendingNamedChoiceGrants(allToolGrants);
  const pendingWeapons = getPendingNamedChoiceGrants(allWeaponGrants);
  const speciesToolGrantPickers = pendingTools.filter(
    (g) => g.source.type === "species",
  );
  const speciesWeaponGrantPickers = pendingWeapons.filter(
    (g) => g.source.type === "species",
  );
  const bgToolGrants = pendingTools.filter((g) => g.source.type === "background");
  const classToolGrants = pendingTools.filter((g) => g.source.type === "class");
  const hasWeaponPickers = speciesWeaponGrantPickers.length > 0;
  const hasToolPickers =
    speciesToolGrantPickers.length > 0 ||
    bgToolGrants.length > 0 ||
    classToolGrants.length > 0;
  const hasPickers = hasWeaponPickers || hasToolPickers;

  const classToolChoiceLists = Object.values(classToolChoices);
  const fixedWeaponItems = excludeChosenItems(
    resolvedWeaponItems,
    hasWeaponPickers ? speciesWeaponChoices : undefined,
  );
  const fixedToolItems = excludeChosenItems(
    resolvedToolItems,
    hasToolPickers ? speciesToolChoices : undefined,
    hasToolPickers ? backgroundToolChoices : undefined,
    ...(hasToolPickers ? classToolChoiceLists : []),
  );

  const totalCount =
    resolvedToolItems.length +
    resolvedArmorItems.length +
    resolvedWeaponItems.length;

  const showArmor = !!selectedClass;
  const showWeapons = !!selectedClass || hasWeaponPickers;
  const showTools = fixedToolItems.length > 0 || hasToolPickers;
  const hasAnyContent = showArmor || showWeapons || showTools;
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

            {hasPickers && <BuilderSourceLegend />}

            {showArmor && (
              <div className="mt-3 first:mt-0">
                <CategoryHeading icon={Shield} label="Armor" />
                {resolvedArmorItems.length > 0 ? (
                  <BuilderGrantBadgeList
                    items={resolvedArmorItems}
                    sources={armorSources}
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    No armor proficiency
                  </p>
                )}
              </div>
            )}

            {showWeapons && (
              <div className="mt-3 first:mt-0">
                <CategoryHeading icon={Sword} label="Weapons" />
                {fixedWeaponItems.length > 0 ? (
                  <BuilderGrantBadgeList
                    items={fixedWeaponItems}
                    sources={weaponSources}
                  />
                ) : (
                  !hasWeaponPickers && (
                    <p className="text-[11px] text-muted-foreground">
                      No weapon proficiency
                    </p>
                  )
                )}
                {speciesWeaponGrantPickers.length > 0 && (
                  <BuilderNamedPicker
                    grants={speciesWeaponGrantPickers}
                    chosen={speciesWeaponChoices}
                    onChange={setSpeciesWeaponChoices}
                    label="Species weapons"
                    pickerSourceType="species"
                  />
                )}
              </div>
            )}

            {showTools && (
              <div className="mt-3 first:mt-0">
                <CategoryHeading icon={Wrench} label="Tools" />
                {fixedToolItems.length > 0 && (
                  <BuilderGrantBadgeList
                    items={fixedToolItems}
                    sources={toolSources}
                  />
                )}
                {speciesToolGrantPickers.length > 0 && (
                  <BuilderNamedPicker
                    grants={speciesToolGrantPickers}
                    chosen={speciesToolChoices}
                    onChange={setSpeciesToolChoices}
                    label="Species tools"
                    pickerSourceType="species"
                  />
                )}
                {bgToolGrants.length > 0 && (
                  <BuilderNamedPicker
                    grants={bgToolGrants}
                    chosen={backgroundToolChoices}
                    onChange={setBackgroundToolChoices}
                    label="Background tools"
                    pickerSourceType="background"
                  />
                )}
                {classToolGrants.map((grant, grantIndex) => (
                  <BuilderNamedPicker
                    key={`class-tool-${grantIndex}`}
                    grants={[grant]}
                    chosen={classToolChoices[grantIndex] ?? []}
                    onChange={(items) =>
                      setClassToolChoicesAtIndex(grantIndex, items)
                    }
                    label={
                      classToolGrants.length > 1
                        ? `Class tools (${grantIndex + 1}/${classToolGrants.length})`
                        : "Class tools"
                    }
                    pickerSourceType="class"
                  />
                ))}
              </div>
            )}

            {!hasAnyContent && (
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
