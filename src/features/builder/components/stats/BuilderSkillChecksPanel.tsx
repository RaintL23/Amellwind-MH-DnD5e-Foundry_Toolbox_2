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
    setClassSkillChoices,
    setBackgroundSkillChoices,
    setSpeciesSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
  } = useCharacterBuilder();

  // Pending choose/any grants that need player input
  const pending = getPendingChoiceGrants(allSkillGrants);
  const classGrants = pending.filter((g) => g.source.type === "class");
  const bgGrants = pending.filter((g) => g.source.type === "background");
  const speciesGrants = pending.filter((g) => g.source.type === "species");
  const featGrants = pending.filter((g) => g.source.type === "feat");

  // Pending expertise
  const pendingExpertise = getPendingExpertiseGrants(allExpertiseGrants);

  // Build advantage set for quick lookup
  const advantageSkills = new Set<SkillKey>(
    allSkillAdvantages.filter((a) => a.kind === "advantage").map((a) => a.skill),
  );
  const disadvantageSkills = new Set<SkillKey>(
    allSkillAdvantages.filter((a) => a.kind === "disadvantage").map((a) => a.skill),
  );

  function buildTooltip(skill: SkillKey): string | undefined {
    const sources = skillSources[skill];
    const expSource = expertiseSources[skill];
    const advGrants = allSkillAdvantages.filter(
      (a) => a.skill === skill,
    );

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

  return (
    <BuilderPanel
      title={
        <>
          <ListChecks className="h-3.5 w-3.5" aria-hidden /> Skill Checks
        </>
      }
    >
      {/* Class skill picker */}
      {classGrants.length > 0 && (
        <BuilderSkillPicker
          grants={classGrants}
          chosen={classSkillChoices}
          alreadyGranted={skillSources}
          onChange={setClassSkillChoices}
          label="Class skills"
        />
      )}

      {/* Background skill picker */}
      {bgGrants.length > 0 && (
        <BuilderSkillPicker
          grants={bgGrants}
          chosen={backgroundSkillChoices}
          alreadyGranted={skillSources}
          onChange={setBackgroundSkillChoices}
          label="Background skills"
        />
      )}

      {/* Species skill picker */}
      {speciesGrants.length > 0 && (
        <BuilderSkillPicker
          grants={speciesGrants}
          chosen={speciesSkillChoices}
          alreadyGranted={skillSources}
          onChange={setSpeciesSkillChoices}
          label="Species skills"
        />
      )}

      {/* Feat skill pickers */}
      {featGrants.map((grant, i) => (
        <BuilderSkillPicker
          key={`feat-${i}`}
          grants={[grant]}
          chosen={featSkillChoices[i] ?? []}
          alreadyGranted={skillSources}
          onChange={(skills) => setFeatSkillChoices(i, skills)}
          label={`Feat: ${grant.source.name}`}
        />
      ))}

      {/* Expertise picker */}
      {pendingExpertise.length > 0 && (
        <BuilderExpertisePicker
          grants={pendingExpertise}
          expertiseChoices={expertiseChoices}
          onChoose={(id, skills) => setExpertiseChoices(id, skills)}
        />
      )}

      {/* Skill list */}
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
