import type {
  BuildCompletenessIssue,
  BuildCompletenessResult,
  BuildCompletenessSection,
} from "../build-completeness.types";

export type CompletenessStepId =
  | "origin"
  | "class-feats"
  | "ability-scores"
  | "proficiencies"
  | "spells"
  | "equipment";

export interface CompletenessStep {
  id: CompletenessStepId;
  label: string;
  /** Sections that belong to this step. */
  sections: BuildCompletenessSection[];
  complete: boolean;
  issues: BuildCompletenessIssue[];
}

const STEP_DEFS: ReadonlyArray<{
  id: CompletenessStepId;
  label: string;
  sections: BuildCompletenessSection[];
  /** When true, the step is omitted unless it has issues OR spells apply. */
  onlyWhenRelevant?: boolean;
}> = [
  {
    id: "origin",
    label: "Origin",
    sections: ["identity"],
  },
  {
    id: "class-feats",
    label: "Class & Feats",
    sections: ["feats", "optional-features"],
  },
  {
    id: "ability-scores",
    label: "Ability Scores",
    sections: ["ability-scores"],
  },
  {
    id: "proficiencies",
    label: "Proficiencies",
    sections: ["skills", "tools", "languages", "defenses"],
  },
  {
    id: "spells",
    label: "Spells",
    sections: ["spells"],
    onlyWhenRelevant: true,
  },
  {
    id: "equipment",
    label: "Equipment",
    sections: ["starting-equipment"],
  },
];

/**
 * Groups completeness issues into ordered workflow steps for the progress bar.
 * Spells step is included when the character is a caster or there are spell issues.
 */
export function groupCompletenessSteps(
  result: BuildCompletenessResult,
  options?: { isSpellcaster?: boolean },
): CompletenessStep[] {
  const isSpellcaster = options?.isSpellcaster ?? false;
  const steps: CompletenessStep[] = [];

  for (const def of STEP_DEFS) {
    const sectionIssues = result.issues.filter((issue) =>
      def.sections.includes(issue.section),
    );

    if (def.onlyWhenRelevant && !isSpellcaster && sectionIssues.length === 0) {
      continue;
    }

    // Identity issues for class/subclass belong with Class & Feats visually.
    if (def.id === "origin") {
      const originIssues = sectionIssues.filter(
        (i) =>
          i.highlightKey !== "class" &&
          i.highlightKey !== "subclass" &&
          i.id !== "identity-class" &&
          i.id !== "identity-subclass",
      );
      steps.push({
        id: def.id,
        label: def.label,
        sections: def.sections,
        complete: originIssues.length === 0,
        issues: originIssues,
      });
      continue;
    }

    if (def.id === "class-feats") {
      const classIdentityIssues = result.issues.filter(
        (i) =>
          i.section === "identity" &&
          (i.highlightKey === "class" ||
            i.highlightKey === "subclass" ||
            i.id === "identity-class" ||
            i.id === "identity-subclass"),
      );
      const allIssues = [...classIdentityIssues, ...sectionIssues];
      steps.push({
        id: def.id,
        label: def.label,
        sections: def.sections,
        complete: allIssues.length === 0,
        issues: allIssues,
      });
      continue;
    }

    steps.push({
      id: def.id,
      label: def.label,
      sections: def.sections,
      complete: sectionIssues.length === 0,
      issues: sectionIssues,
    });
  }

  return steps;
}

export function countCompletenessProgress(steps: CompletenessStep[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = steps.length;
  const completed = steps.filter((s) => s.complete).length;
  return {
    completed,
    total,
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
  };
}
