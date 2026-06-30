import { cn } from "@/shared/utils/cn";
import type { SkillKey } from "@/shared/types";
import type { ExpertiseGrant } from "@/shared/types/proficiency.types";
import { SKILL_LABELS } from "@/shared/constants/dnd";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";

interface ExpertisePickerProps {
  grants: Array<Extract<ExpertiseGrant, { kind: "chooseProficient" }>>;
  expertiseChoices: Record<string, SkillKey[]>;
  onChoose: (grantId: string, skills: SkillKey[]) => void;
}

export function BuilderExpertisePicker({
  grants,
  expertiseChoices,
  onChoose,
}: ExpertisePickerProps) {
  const { character, skillSources } = useCharacterBuilder();

  if (!grants.length) return null;

  const proficientSkills = (Object.keys(SKILL_LABELS) as SkillKey[]).filter(
    (sk) => character.getSkillProficiencyLevel(sk) >= 1,
  );

  function eligibleSkillsForGrant(
    grant: Extract<ExpertiseGrant, { kind: "chooseProficient" }>,
  ): SkillKey[] {
    if (!grant.from?.length) return proficientSkills;
    return proficientSkills.filter((skill) => grant.from!.includes(skill));
  }

  return (
    <div className="mt-2 space-y-2">
      {grants.map((grant, i) => {
        const grantId = `${grant.source.name}-${i}`;
        const chosen = expertiseChoices[grantId] ?? [];
        const eligibleSkills = eligibleSkillsForGrant(grant);

        function toggle(skill: SkillKey) {
          if (chosen.includes(skill)) {
            onChoose(grantId, chosen.filter((s) => s !== skill));
          } else if (chosen.length < grant.count) {
            onChoose(grantId, [...chosen, skill]);
          }
        }

        return (
          <div
            key={grantId}
            className="rounded-md border border-violet-500/30 bg-violet-500/5 p-2"
          >
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
              {grant.source.name} — Expertise (choose {grant.count})
            </p>
            {eligibleSkills.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">
                {grant.from?.length
                  ? "Pick class skills first — none of the listed options are proficient yet."
                  : "No proficient skills yet."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {eligibleSkills.map((skill) => {
                  const isChosen = chosen.includes(skill);
                  const isDisabled = !isChosen && chosen.length >= grant.count;
                  const sources = skillSources[skill];
                  const tooltip = sources
                    ? sources.map((s) => s.name).join(", ")
                    : undefined;

                  return (
                    <button
                      key={skill}
                      type="button"
                      disabled={isDisabled}
                      title={tooltip}
                      onClick={() => toggle(skill)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                        isChosen &&
                          "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400",
                        !isChosen && !isDisabled &&
                          "border-border text-muted-foreground hover:border-violet-500/50 hover:bg-muted/50",
                        !isChosen && isDisabled &&
                          "cursor-not-allowed border-border/40 text-muted-foreground/40",
                      )}
                    >
                      {SKILL_LABELS[skill]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
