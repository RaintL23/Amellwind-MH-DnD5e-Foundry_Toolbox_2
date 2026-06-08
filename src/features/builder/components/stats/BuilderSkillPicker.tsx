import { cn } from "@/shared/utils/cn";
import type { SkillKey, SkillProficiencyGrant, ProficiencySource } from "@/shared/types";
import { SKILL_LABELS } from "../../utils/check-modifiers.utils";

interface SkillPickerProps {
  /** Grants that require player input (kind = choose | any). */
  grants: Array<
    | { kind: "choose"; from: SkillKey[]; count: number; source: ProficiencySource }
    | { kind: "any"; count: number; source: ProficiencySource }
  >;
  /** Currently selected skills by the player. */
  chosen: SkillKey[];
  /** Skills already granted by other sources (shown as locked). */
  alreadyGranted: Partial<Record<SkillKey, import("@/shared/types").ProficiencySource[]>>;
  onChange: (skills: SkillKey[]) => void;
  label?: string;
}

export function BuilderSkillPicker({
  grants,
  chosen,
  alreadyGranted,
  onChange,
  label,
}: SkillPickerProps) {
  if (!grants.length) return null;

  // Total count and allowed skills across all grants
  const totalCount = grants.reduce((acc, g) => acc + g.count, 0);
  const allowedSet = new Set<SkillKey>();
  for (const g of grants) {
    if (g.kind === "choose") g.from.forEach((s) => allowedSet.add(s));
    else {
      // "any" — all skills
      (Object.keys(SKILL_LABELS) as SkillKey[]).forEach((s) => allowedSet.add(s));
    }
  }
  const allowed = [...allowedSet].sort((a, b) =>
    SKILL_LABELS[a].localeCompare(SKILL_LABELS[b]),
  );

  function toggle(skill: SkillKey) {
    if (chosen.includes(skill)) {
      onChange(chosen.filter((s) => s !== skill));
    } else if (chosen.length < totalCount) {
      onChange([...chosen, skill]);
    }
  }

  const grantSourceName = grants[0]?.source.name ?? "";

  return (
    <div className="mt-2 rounded-md border border-border/50 bg-muted/30 p-2">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label ?? grantSourceName} — choose {totalCount}
      </p>
      <div className="flex flex-wrap gap-1">
        {allowed.map((skill) => {
          const isChosen = chosen.includes(skill);
          const grantedBy = alreadyGranted[skill];
          const isLocked = !!grantedBy?.length;
          const isDisabled = isLocked || (!isChosen && chosen.length >= totalCount);

          return (
            <button
              key={skill}
              type="button"
              disabled={isDisabled && !isChosen}
              title={
                isLocked
                  ? `Already granted by: ${grantedBy!.map((s) => s.name).join(", ")}`
                  : undefined
              }
              onClick={() => !isLocked && toggle(skill)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                isLocked &&
                  "cursor-default border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 opacity-70",
                isChosen && !isLocked &&
                  "border-primary bg-primary/15 text-primary",
                !isChosen && !isLocked && !isDisabled &&
                  "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground",
                !isChosen && !isLocked && isDisabled &&
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

// Re-export for convenience
export type { SkillPickerProps, SkillProficiencyGrant };
