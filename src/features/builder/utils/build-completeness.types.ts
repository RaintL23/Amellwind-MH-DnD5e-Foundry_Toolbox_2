import type { BuilderSlotSelection } from "../hooks/useBuilderSlotSelection";

export type BuildCompletenessSection =
  | "identity"
  | "feats"
  | "optional-features"
  | "ability-scores"
  | "skills"
  | "tools"
  | "languages"
  | "defenses"
  | "starting-equipment"
  | "spells";

export interface BuildCompletenessIssue {
  id: string;
  section: BuildCompletenessSection;
  message: string;
  slot?: BuilderSlotSelection;
  highlightKey?: string;
}

export interface BuildCompletenessResult {
  hasStarted: boolean;
  issues: BuildCompletenessIssue[];
  shouldBlockExport: boolean;
}
