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
  | {
      kind: "chooseProficient";
      count: number;
      /** When set, only these skills are eligible (must also be proficient). */
      from?: SkillKey[];
      source: ProficiencySource;
    };

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

/** Tool, language, gaming set, and similar non-skill proficiencies. */
export type NamedProficiencyGrant =
  | { kind: "fixed"; items: string[]; source: ProficiencySource }
  | { kind: "choose"; from: string[]; count: number; source: ProficiencySource }
  | {
      kind: "any";
      count: number;
      /** Display label, e.g. "Standard language" or "Artisan's tool". */
      label: string;
      /** When set, player picks from this list; otherwise freeform entry. */
      options?: string[];
      source: ProficiencySource;
    };

export type DefenseKind = "resistance" | "immunity";

/** Damage resistance or immunity from species, class features, etc. */
export type DefenseGrant =
  | {
      kind: "fixed";
      types: import("./actor.types").DamageType[];
      defenseKind: DefenseKind;
      source: ProficiencySource;
    }
  | {
      kind: "choose";
      from: import("./actor.types").DamageType[];
      count: number;
      defenseKind: DefenseKind;
      source: ProficiencySource;
    };
