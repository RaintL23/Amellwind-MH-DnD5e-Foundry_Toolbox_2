import { cn } from "@/shared/utils/cn";
import type { SkillKey, SkillProficiencyGrant, ProficiencySource } from "@/shared/types";
import type { ProficiencySourceType } from "@/shared/types/proficiency.types";
import { SKILL_LABELS } from "../../utils/check-modifiers.utils";
import {
  badgeStyleForSource,
  dominantSourceType,
  SOURCE_LABELS,
} from "../../utils/proficiency-source-styles";

interface SkillPickerProps {
  /** Grants that require player input (kind = choose | any). */
  grants: Array<
    | { kind: "choose"; from: SkillKey[]; count: number; source: ProficiencySource }
    | { kind: "any"; count: number; source: ProficiencySource }
  >;
  /** Currently selected skills by the player in this picker. */
  chosen: SkillKey[];
  /** Skills granted by higher-priority sources (species > background > class). */
  alreadyGranted: Partial<Record<SkillKey, ProficiencySource[]>>;
  onChange: (skills: SkillKey[]) => void;
  label?: string;
  /** Source type of this picker — used for badge color on user picks. */
  pickerSourceType: ProficiencySourceType;
}

export function BuilderSkillPicker({
  grants,
  chosen,
  alreadyGranted,
  onChange,
  label,
  pickerSourceType,
}: SkillPickerProps) {
  if (!grants.length) return null;

  const totalCount = grants.reduce((acc, g) => acc + g.count, 0);
  const allowedSet = new Set<SkillKey>();
  for (const g of grants) {
    if (g.kind === "choose") g.from.forEach((s) => allowedSet.add(s));
    else {
      (Object.keys(SKILL_LABELS) as SkillKey[]).forEach((s) => allowedSet.add(s));
    }
  }
  const allowed = [...allowedSet].sort((a, b) =>
    SKILL_LABELS[a].localeCompare(SKILL_LABELS[b]),
  );

  /**
   * Skills in this picker's list already proficient from a higher-priority source.
   * These are shown for awareness only — they do NOT reduce this picker's slot count.
   * (e.g. Background Nature + Class choose 2 = 3 total proficiencies.)
   */
  const coveredInList = allowed.filter((skill) => !!alreadyGranted[skill]?.length);
  /** Picks made in this picker that count toward its quota. */
  const effectiveChosen = chosen.filter((s) => !alreadyGranted[s]?.length);
  const remainingPicks = Math.max(0, totalCount - effectiveChosen.length);
  const canPickMore = remainingPicks > 0;

  function handleClick(skill: SkillKey, isChosen: boolean, coveredByHigher: boolean) {
    if (isChosen) {
      onChange(chosen.filter((s) => s !== skill));
      return;
    }
    if (!coveredByHigher && canPickMore) {
      onChange([...chosen, skill]);
    }
  }

  const grantSourceName = grants[0]?.source.name ?? "";
  const pickerColor = badgeStyleForSource(pickerSourceType);

  return (
    <div className="mt-2 rounded-md border border-border/50 bg-muted/30 p-2">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label ?? grantSourceName} — choose {totalCount}
        {coveredInList.length > 0 && (
          <span className="normal-case text-muted-foreground/80">
            {" "}
            (
            {coveredInList.map((s) => SKILL_LABELS[s]).join(", ")} from other source
            {coveredInList.length > 1 ? "s" : ""} — pick{" "}
            {remainingPicks > 0 ? remainingPicks : 0} here
            {remainingPicks === 0 ? " (done)" : ""})
          </span>
        )}
        {coveredInList.length === 0 && remainingPicks > 0 && remainingPicks < totalCount && (
          <span className="normal-case text-muted-foreground/80">
            {" "}
            (pick {remainingPicks} more)
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-1">
        {allowed.map((skill) => {
          const isChosen = chosen.includes(skill);
          const grantedBy = alreadyGranted[skill];
          const coveredByHigher = !!grantedBy?.length;
          const isDisabled =
            (coveredByHigher && !isChosen) ||
            (!isChosen && !coveredByHigher && !canPickMore);

          const badgeColor = coveredByHigher
            ? badgeStyleForSource(dominantSourceType(grantedBy!))
            : isChosen
              ? pickerColor
              : undefined;

          const tooltip = coveredByHigher
            ? `Proficient from ${SOURCE_LABELS[dominantSourceType(grantedBy!)]} (${grantedBy!.map((s) => s.name).join(", ")}) — choose a different skill for your ${SOURCE_LABELS[pickerSourceType]} slots`
            : isChosen
              ? `Your ${SOURCE_LABELS[pickerSourceType]} choice`
              : undefined;

          return (
            <button
              key={skill}
              type="button"
              disabled={isDisabled}
              title={tooltip}
              onClick={() => handleClick(skill, isChosen, coveredByHigher)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                badgeColor,
                coveredByHigher && !isChosen && "cursor-default",
                !badgeColor && !isDisabled &&
                  "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
                !badgeColor && isDisabled &&
                  "cursor-not-allowed border-border/40 text-muted-foreground/40",
              )}
            >
              {SKILL_LABELS[skill]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { SkillPickerProps, SkillProficiencyGrant };
