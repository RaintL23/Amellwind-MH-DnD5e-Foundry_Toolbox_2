import type {
  BuildCompletenessIssue,
  BuildCompletenessResult,
} from "../build-completeness.types";

export type CompletenessStepId =
  | "class"
  | "origin"
  | "ability-scores"
  | "feats"
  | "proficiencies"
  | "spells"
  | "equipment";

/** `locked` = the step depends on a class that has not been chosen yet. */
export type CompletenessStepStatus = "complete" | "pending" | "locked";

export interface CompletenessStep {
  id: CompletenessStepId;
  label: string;
  /** One-line, beginner-friendly explanation of why the step matters. */
  description: string;
  status: CompletenessStepStatus;
  complete: boolean;
  issues: BuildCompletenessIssue[];
}

export interface GroupCompletenessStepsOptions {
  isSpellcaster?: boolean;
  hasClass?: boolean;
  /** True when the class/level grants at least one feat slot. */
  hasFeatSlots?: boolean;
}

interface StepDef {
  id: CompletenessStepId;
  label: string;
  description: string;
  /** Step cannot be completed until a class is chosen. */
  requiresClass?: boolean;
  /** Step is omitted unless it has issues or the predicate holds. */
  isRelevant?: (options: Required<GroupCompletenessStepsOptions>) => boolean;
}

/**
 * Canonical creation order (PHB 2024: class → origin → ability scores).
 * Shared by the progress checklist and the "Next step" card.
 */
const STEP_DEFS: readonly StepDef[] = [
  {
    id: "class",
    label: "Class",
    description:
      "Your class defines how you fight, cast spells and help your party. Every other choice builds on it.",
  },
  {
    id: "origin",
    label: "Species & Background",
    description:
      "Where your character comes from: species traits, background skills and an origin feat.",
  },
  {
    id: "ability-scores",
    label: "Ability Scores",
    description:
      "Six numbers (STR, DEX, CON, INT, WIS, CHA) behind every roll. Put your highest score in your class's key ability.",
  },
  {
    id: "feats",
    label: "Feats",
    description:
      "Extra talents your class unlocks at higher levels: improve ability scores or learn a new trick.",
    requiresClass: true,
    isRelevant: (options) => options.hasFeatSlots,
  },
  {
    id: "proficiencies",
    label: "Skills & Proficiencies",
    description:
      "Pick the skills, tools and languages your character is trained in.",
    requiresClass: true,
  },
  {
    id: "spells",
    label: "Spells",
    description:
      "Choose the cantrips and spells your character knows or prepares.",
    requiresClass: true,
    isRelevant: (options) => options.isSpellcaster,
  },
  {
    id: "equipment",
    label: "Starting Equipment",
    description: "Choose the gear your class and background start with.",
    requiresClass: true,
  },
];

const CLASS_IDENTITY_ISSUE_IDS = new Set(["identity-class", "identity-subclass"]);
const ORIGIN_FEAT_ISSUE_PREFIXES = ["origin-feat", "opt-origin-feat-"];

/** Maps one completeness issue to the workflow step that resolves it. */
export function stepIdForIssue(issue: BuildCompletenessIssue): CompletenessStepId {
  switch (issue.section) {
    case "identity":
      return CLASS_IDENTITY_ISSUE_IDS.has(issue.id) ? "class" : "origin";
    case "optional-features":
      return "class";
    case "feats":
      return ORIGIN_FEAT_ISSUE_PREFIXES.some((prefix) => issue.id.startsWith(prefix))
        ? "origin"
        : "feats";
    case "ability-scores":
      return "ability-scores";
    case "skills":
    case "tools":
    case "languages":
    case "defenses":
      return "proficiencies";
    case "spells":
      return "spells";
    case "starting-equipment":
      return "equipment";
  }
}

/** Groups completeness issues into ordered workflow steps for the progress UI. */
export function groupCompletenessSteps(
  result: BuildCompletenessResult,
  options?: GroupCompletenessStepsOptions,
): CompletenessStep[] {
  const resolved: Required<GroupCompletenessStepsOptions> = {
    isSpellcaster: options?.isSpellcaster ?? false,
    hasClass: options?.hasClass ?? true,
    hasFeatSlots: options?.hasFeatSlots ?? false,
  };

  const issuesByStep = new Map<CompletenessStepId, BuildCompletenessIssue[]>();
  for (const issue of result.issues) {
    const stepId = stepIdForIssue(issue);
    const bucket = issuesByStep.get(stepId);
    if (bucket) bucket.push(issue);
    else issuesByStep.set(stepId, [issue]);
  }

  const steps: CompletenessStep[] = [];
  for (const def of STEP_DEFS) {
    const issues = issuesByStep.get(def.id) ?? [];
    if (def.isRelevant && issues.length === 0 && !def.isRelevant(resolved)) {
      continue;
    }

    const status: CompletenessStepStatus =
      issues.length > 0
        ? "pending"
        : def.requiresClass && !resolved.hasClass
          ? "locked"
          : "complete";

    steps.push({
      id: def.id,
      label: def.label,
      description: def.description,
      status,
      complete: status === "complete",
      issues,
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

export interface NextCompletenessStep {
  step: CompletenessStep;
  /** 1-based position of the step in the checklist. */
  position: number;
  issue: BuildCompletenessIssue;
}

/** First pending step in canonical order, or null when nothing is left to do. */
export function getNextStep(
  steps: CompletenessStep[],
): NextCompletenessStep | null {
  for (const [index, step] of steps.entries()) {
    const issue = step.issues[0];
    if (step.status === "pending" && issue) {
      return { step, position: index + 1, issue };
    }
  }
  return null;
}
