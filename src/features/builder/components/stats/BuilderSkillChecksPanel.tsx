import { formatModifier } from "@/shared/utils/cr.utils";
import { ListChecks } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import {
  SKILL_LABELS,
  SKILL_ORDER,
} from "../../utils/check-modifiers.utils";
import { BuilderPanel } from "../shared/BuilderPanel";
import { BuilderStatRow } from "./BuilderStatRow";
import { BuilderSkillPicker } from "./BuilderSkillPicker";
import { BuilderExpertisePicker } from "./BuilderExpertisePicker";
import type { SkillKey } from "@/shared/types";
import {
  getPendingChoiceGrants,
  getPendingExpertiseGrants,
} from "../../utils/compute-character-proficiencies";
import { skillsFromHigherPriority } from "../../utils/skill-choice-hierarchy.utils";
import {
  badgeStyleForSource,
  SOURCE_LABELS,
} from "../../utils/proficiency-source-styles";

export function BuilderSkillChecksPanel() {
  const {
    character,
    allSkillGrants,
    allExpertiseGrants,
    allSkillAdvantages,
    classSkillChoices,
    backgroundSkillChoices,
    speciesSkillChoices,
    featSkillChoices,
    expertiseChoices,
    skillSources,
    expertiseSources,
    setClassSkillChoicesAtIndex,
    setBackgroundSkillChoices,
    setSpeciesSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
  } = useCharacterBuilder();

  const speciesGrantList = allSkillGrants.filter((g) => g.source.type === "species");
  const bgGrantList = allSkillGrants.filter((g) => g.source.type === "background");
  const classGrantList = allSkillGrants.filter((g) => g.source.type === "class");

  const pending = getPendingChoiceGrants(allSkillGrants);
  const speciesGrants = pending.filter((g) => g.source.type === "species");
  const bgGrants = pending.filter((g) => g.source.type === "background");
  const classGrants = pending.filter((g) => g.source.type === "class");
  const featGrants = pending.filter((g) => g.source.type === "feat");

  const higherThanSpecies = skillsFromHigherPriority(
    "species",
    [],
    [],
    [],
    [],
    [],
    [],
  );
  const higherThanBackground = skillsFromHigherPriority(
    "background",
    speciesGrantList,
    speciesSkillChoices,
    [],
    [],
    [],
    [],
  );
  const higherThanClass = skillsFromHigherPriority(
    "class",
    speciesGrantList,
    speciesSkillChoices,
    bgGrantList,
    backgroundSkillChoices,
    [],
    [],
  );
  const flatClassSkillChoices = Object.values(classSkillChoices).flat();
  const higherThanFeat = skillsFromHigherPriority(
    "feat",
    speciesGrantList,
    speciesSkillChoices,
    bgGrantList,
    backgroundSkillChoices,
    classGrantList,
    flatClassSkillChoices,
  );

  const pendingExpertise = getPendingExpertiseGrants(allExpertiseGrants);

  const advantageSkills = new Set<SkillKey>(
    allSkillAdvantages.filter((a) => a.kind === "advantage").map((a) => a.skill),
  );
  const disadvantageSkills = new Set<SkillKey>(
    allSkillAdvantages.filter((a) => a.kind === "disadvantage").map((a) => a.skill),
  );

  function buildTooltip(skill: SkillKey): string | undefined {
    const sources = skillSources[skill];
    const expSource = expertiseSources[skill];
    const advGrants = allSkillAdvantages.filter((a) => a.skill === skill);

    const parts: string[] = [];
    if (sources?.length) {
      parts.push(`Prof: ${sources.map((s) => s.name).join(", ")}`);
    }
    if (expSource) {
      parts.push(`Expertise: ${expSource.name}`);
    }
    for (const a of advGrants) {
      parts.push(
        `${a.kind === "advantage" ? "Advantage" : "Disadvantage"}: ${a.source.name}${a.condition ? ` (${a.condition})` : ""}`,
      );
    }
    return parts.length ? parts.join("\n") : undefined;
  }

  const hasPickers =
    speciesGrants.length > 0 ||
    bgGrants.length > 0 ||
    classGrants.length > 0 ||
    featGrants.length > 0;

  return (
    <BuilderPanel
      title={
        <>
          <ListChecks className="h-3.5 w-3.5" aria-hidden /> Skill Checks
        </>
      }
    >
      {hasPickers && (
        <div className="mb-2 flex flex-wrap gap-2 text-[9px] text-muted-foreground">
          {(["species", "background", "class", "feat"] as const).map((type) => (
            <span key={type} className="flex items-center gap-1">
              <span
                className={`inline-block h-2 w-2 rounded-full border ${badgeStyleForSource(type)}`}
                aria-hidden
              />
              {SOURCE_LABELS[type]}
            </span>
          ))}
        </div>
      )}

      {/* Species → Background → Class (priority order) */}
      {speciesGrants.length > 0 && (
        <BuilderSkillPicker
          grants={speciesGrants}
          chosen={speciesSkillChoices}
          alreadyGranted={higherThanSpecies}
          onChange={setSpeciesSkillChoices}
          label="Species skills"
          pickerSourceType="species"
        />
      )}

      {bgGrants.length > 0 && (
        <BuilderSkillPicker
          grants={bgGrants}
          chosen={backgroundSkillChoices}
          alreadyGranted={higherThanBackground}
          onChange={setBackgroundSkillChoices}
          label="Background skills"
          pickerSourceType="background"
        />
      )}

      {classGrants.map((grant, grantIndex) => (
        <BuilderSkillPicker
          key={`class-grant-${grantIndex}`}
          grants={[grant]}
          chosen={classSkillChoices[grantIndex] ?? []}
          alreadyGranted={higherThanClass}
          onChange={(skills) => setClassSkillChoicesAtIndex(grantIndex, skills)}
          label={
            classGrants.length > 1
              ? `Class skills (${grantIndex + 1}/${classGrants.length})`
              : "Class skills"
          }
          pickerSourceType="class"
        />
      ))}

      {featGrants.map((grant, i) => (
        <BuilderSkillPicker
          key={`feat-${i}`}
          grants={[grant]}
          chosen={featSkillChoices[i] ?? []}
          alreadyGranted={higherThanFeat}
          onChange={(skills) => setFeatSkillChoices(i, skills)}
          label={`Feat: ${grant.source.name}`}
          pickerSourceType="feat"
        />
      ))}

      {pendingExpertise.length > 0 && (
        <BuilderExpertisePicker
          grants={pendingExpertise}
          expertiseChoices={expertiseChoices}
          onChoose={(id, skills) => setExpertiseChoices(id, skills)}
        />
      )}

      <div className="mt-2 space-y-0">
        {SKILL_ORDER.map((skill) => {
          const level = character.getSkillProficiencyLevel(skill);
          return (
            <BuilderStatRow
              key={skill}
              label={SKILL_LABELS[skill]}
              value={formatModifier(character.getSkillModifier(skill))}
              secondary={`P ${character.getPassiveScore(skill)}`}
              proficient={level === 1}
              expertise={level === 2}
              advantage={advantageSkills.has(skill)}
              disadvantage={disadvantageSkills.has(skill)}
              proficiencySources={skillSources[skill]}
              sourcesTooltip={buildTooltip(skill)}
            />
          );
        })}
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">
        P = Passive score · ● Prof · 2× Expertise · ADV/DIS
      </p>
    </BuilderPanel>
  );
}
