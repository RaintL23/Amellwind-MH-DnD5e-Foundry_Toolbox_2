import type { AbilityKey, SkillKey } from "./actor.types";

export type ProficiencySourceType =
  | "species"
  | "background"
  | "class"
  | "subclass"
  | "feat"
  | "feature";

export interface ProficiencySource {
  type: ProficiencySourceType;
  name: string;
}

export type SkillProficiencyGrant =
  | { kind: "fixed"; skills: SkillKey[]; source: ProficiencySource }
  | { kind: "choose"; from: SkillKey[]; count: number; source: ProficiencySource }
  | { kind: "any"; count: number; source: ProficiencySource };

export type ExpertiseGrant =
  | { kind: "fixed"; skills: SkillKey[]; source: ProficiencySource }
  | { kind: "chooseProficient"; count: number; source: ProficiencySource };

export interface SkillAdvantageGrant {
  skill: SkillKey;
  kind: "advantage" | "disadvantage";
  /** Human-readable condition (e.g. "in swampy terrain") */
  condition: string;
  source: ProficiencySource;
}

export type SaveProficiencyGrant = {
  abilities: AbilityKey[];
  source: ProficiencySource;
};
