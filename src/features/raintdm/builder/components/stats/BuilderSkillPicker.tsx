import type { SkillKey, SkillProficiencyGrant, ProficiencySource } from "@/shared/types";
import type { ProficiencySourceType } from "@/shared/types/proficiency.types";
import { SKILL_LABELS } from "@/shared/constants/dnd";
import {
  badgeStyleForSource,
  dominantSourceType,
  SOURCE_LABELS,
} from "../../utils/proficiency-source-styles";
import {
  PICKER_CONTAINER_CLASS,
  pickerPillClassName,
  pickerQuota,
  type AnyGrant,
  type ChooseGrant,
} from "./picker-shared";

interface SkillPickerProps {
  /** Grants that require player input (kind = choose | any). */
  grants: Array<ChooseGrant<SkillKey> | AnyGrant>;
  /** Currently selected skills by the player in this picker. */
  chosen: SkillKey[];
  /** Skills granted by higher-priority sources (species > background > class). */
  alreadyGranted: Partial<Record<SkillKey, ProficiencySource[]>>;
  /** Skills already picked in another choose/any picker (any priority). */
  chosenElsewhere?: Partial<Record<SkillKey, ProficiencySource[]>>;
  onChange: (skills: SkillKey[]) => void;
  label?: string;
  /** Source type of this picker — used for badge color on user picks. */
  pickerSourceType: ProficiencySourceType;
}

export function BuilderSkillPicker({
  grants,
  chosen,
  alreadyGranted,
  chosenElsewhere = {},
  onChange,
  label,
  pickerSourceType,
}: SkillPickerProps) {
  if (!grants.length) return null;

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
  const { totalCount, remainingPicks, canPickMore, grantSourceName } = pickerQuota(
    grants,
    effectiveChosen.length,
  );

  function handleClick(
    skill: SkillKey,
    isChosen: boolean,
    coveredByHigher: boolean,
    pickedElsewhere: boolean,
  ) {
    if (isChosen) {
      onChange(chosen.filter((s) => s !== skill));
      return;
    }
    if (!coveredByHigher && !pickedElsewhere && canPickMore) {
      onChange([...chosen, skill]);
    }
  }

  const pickerColor = badgeStyleForSource(pickerSourceType);

  return (
    <div className={PICKER_CONTAINER_CLASS}>
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
          const elsewhereBy = chosenElsewhere[skill];
          const pickedElsewhere = !!elsewhereBy?.length;
          const isDisabled =
            (coveredByHigher && !isChosen) ||
            (pickedElsewhere && !isChosen) ||
            (!isChosen && !coveredByHigher && !pickedElsewhere && !canPickMore);

          const badgeColor = coveredByHigher
            ? badgeStyleForSource(dominantSourceType(grantedBy!))
            : isChosen
              ? pickerColor
              : undefined;

          const tooltip = coveredByHigher
            ? `Proficient from ${SOURCE_LABELS[dominantSourceType(grantedBy!)]} (${grantedBy!.map((s) => s.name).join(", ")}) — choose a different skill for your ${SOURCE_LABELS[pickerSourceType]} slots`
            : pickedElsewhere
              ? `Already chosen for ${SOURCE_LABELS[dominantSourceType(elsewhereBy!)]} (${elsewhereBy!.map((s) => s.name).join(", ")})`
              : isChosen
                ? `Your ${SOURCE_LABELS[pickerSourceType]} choice`
                : undefined;

          return (
            <button
              key={skill}
              type="button"
              disabled={isDisabled}
              title={tooltip}
              onClick={() =>
                handleClick(skill, isChosen, coveredByHigher, pickedElsewhere)
              }
              className={pickerPillClassName({
                badgeColor,
                isDisabled,
                cursorDefault: coveredByHigher && !isChosen,
              })}
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
