import { Languages } from "lucide-react";
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
import { BuilderSourceLegend, BuilderGrantBadgeList } from "./BuilderNamedPicker";
import { BuilderLanguagePicker } from "./BuilderLanguagePicker";
import { resolveFixedNamedGrants } from "@/shared/utils/named-proficiency.parser";
import type {
  NamedProficiencyGrant,
  ProficiencySource,
} from "@/shared/types/proficiency.types";

function fixedLanguagesFromGrants(
  grants: NamedProficiencyGrant[],
  sourceType: "species" | "background" | "class",
): string[] {
  return resolveFixedNamedGrants(
    grants.filter((g) => g.source.type === sourceType),
  ).map((e) => e.item);
}

function resolvedLanguagesFromSource(
  grants: NamedProficiencyGrant[],
  choices: string[] | Record<number, string[]>,
  sourceType: "species" | "background" | "class",
): Partial<Record<string, ProficiencySource[]>> {
  const result: Partial<Record<string, ProficiencySource[]>> = {};
  const chooseGrant = grants.find(
    (g) => g.kind !== "fixed" && g.source.type === sourceType,
  );
  const fallbackSource: ProficiencySource = {
    type: sourceType,
    name: sourceType === "species" ? "Species" : sourceType === "background" ? "Background" : "Class",
  };

  for (const { item, source } of resolveFixedNamedGrants(
    grants.filter((g) => g.source.type === sourceType),
  )) {
    const key = item.toLowerCase();
    if (!result[key]) result[key] = [];
    result[key]!.push(source);
  }

  const choiceList = Array.isArray(choices)
    ? choices
    : Object.values(choices).flat();
  for (const item of choiceList) {
    const key = item.toLowerCase();
    if (!result[key]) result[key] = [];
    const source = chooseGrant?.source ?? fallbackSource;
    if (!result[key]!.some((s) => s.type === source.type && s.name === source.name)) {
      result[key]!.push(source);
    }
  }

  return result;
}

function mergeLanguageSourceMaps(
  ...maps: Array<Partial<Record<string, ProficiencySource[]>>>
): Partial<Record<string, ProficiencySource[]>> {
  const result: Partial<Record<string, ProficiencySource[]>> = {};
  for (const map of maps) {
    for (const [key, sources] of Object.entries(map)) {
      if (!sources?.length) continue;
      if (!result[key]) result[key] = [];
      for (const source of sources) {
        if (!result[key]!.some((s) => s.type === source.type && s.name === source.name)) {
          result[key]!.push(source);
        }
      }
    }
  }
  return result;
}

export function BuilderLanguagesPanel() {
  const {
    allLanguageGrants,
    classLanguageChoices,
    backgroundLanguageChoices,
    speciesLanguageChoices,
    setClassLanguageChoicesAtIndex,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    languageSources,
    resolvedLanguageItems,
  } = useCharacterBuilder();

  const pending = getPendingNamedChoiceGrants(allLanguageGrants);
  const speciesGrants = pending.filter((g) => g.source.type === "species");
  const bgGrants = pending.filter((g) => g.source.type === "background");
  const classGrants = pending.filter((g) => g.source.type === "class");
  const hasPickers = pending.length > 0;
  const { highlighted, issues: languageIssues } =
    useSectionCompletenessHighlight("languages");

  const speciesFixed = fixedLanguagesFromGrants(allLanguageGrants, "species");
  const backgroundFixed = fixedLanguagesFromGrants(allLanguageGrants, "background");
  const classFixed = fixedLanguagesFromGrants(allLanguageGrants, "class");

  const speciesLanguages = resolvedLanguagesFromSource(
    allLanguageGrants,
    speciesLanguageChoices,
    "species",
  );
  const backgroundLanguages = resolvedLanguagesFromSource(
    allLanguageGrants,
    backgroundLanguageChoices,
    "background",
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card",
        highlighted &&
          "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30",
      )}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="languages" className="border-0">
          <AccordionTrigger className="gap-1.5 px-3.5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:no-underline">
            <span className="flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5" aria-hidden />
              Languages
              {resolvedLanguageItems.length > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
                  {resolvedLanguageItems.length}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3.5 pb-3.5">
            {highlighted && <CompletenessHighlightBanner issues={languageIssues} />}
            {hasPickers && <BuilderSourceLegend />}

            {speciesGrants.length > 0 && (
              <BuilderLanguagePicker
                grants={speciesGrants}
                chosen={speciesLanguageChoices}
                onChange={setSpeciesLanguageChoices}
                label="Species languages"
                pickerSourceType="species"
                excluded={speciesFixed}
                alreadyGranted={{}}
              />
            )}

            {bgGrants.length > 0 && (
              <BuilderLanguagePicker
                grants={bgGrants}
                chosen={backgroundLanguageChoices}
                onChange={setBackgroundLanguageChoices}
                label="Background languages"
                pickerSourceType="background"
                excluded={backgroundFixed}
                alreadyGranted={speciesLanguages}
              />
            )}

            {classGrants.map((grant, grantIndex) => (
              <BuilderLanguagePicker
                key={`class-lang-${grantIndex}`}
                grants={[grant]}
                chosen={classLanguageChoices[grantIndex] ?? []}
                onChange={(items) =>
                  setClassLanguageChoicesAtIndex(grantIndex, items)
                }
                label={
                  classGrants.length > 1
                    ? `Class languages (${grantIndex + 1}/${classGrants.length})`
                    : "Class languages"
                }
                pickerSourceType="class"
                excluded={classFixed}
                alreadyGranted={mergeLanguageSourceMaps(
                  speciesLanguages,
                  backgroundLanguages,
                )}
              />
            ))}

            <div className="mt-2">
              <BuilderGrantBadgeList
                items={resolvedLanguageItems}
                sources={languageSources}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
