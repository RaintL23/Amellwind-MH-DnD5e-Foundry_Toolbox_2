import { formatModifier } from "@/shared/utils/cr.utils";
import { ListChecks } from "lucide-react";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { SKILL_LABELS, SKILL_ORDER } from "../../utils/check-modifiers.utils";
import { BuilderPanel } from "../shared/BuilderPanel";
import { BuilderStatRow } from "./BuilderStatRow";

export function BuilderSkillChecksPanel() {
  const { character } = useCharacterBuilder();

  return (
    <BuilderPanel
      title={
        <>
          <ListChecks className="h-3.5 w-3.5" aria-hidden /> Skill Checks
        </>
      }
    >
      <div className="space-y-0">
        {SKILL_ORDER.map((skill) => {
          const proficiency = character.getSkillProficiencyLevel(skill);
          return (
            <BuilderStatRow
              key={skill}
              label={SKILL_LABELS[skill]}
              value={formatModifier(character.getSkillModifier(skill))}
              secondary={`P ${character.getPassiveScore(skill)}`}
              proficient={proficiency > 0}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        P = Passive score (10 + skill modifier)
      </p>
    </BuilderPanel>
  );
}
