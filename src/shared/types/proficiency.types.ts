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
  /**
   * Granted by a subclass feature. Keeps `type: "class"` so class choice
   * indices stay stable; only labels use it.
   */
  isSubclass?: boolean;
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

/**
 * Replacement pick ("If you already have this proficiency, you gain one other
 * … of your choice"): the grant only applies for each listed item the
 * character already has from another source. See
 * `resolveConditionalNamedGrants`.
 */
type ConditionalPick = { ifAlreadyProficient?: string[] };

/** Tool, language, gaming set, and similar non-skill proficiencies. */
export type NamedProficiencyGrant =
  | { kind: "fixed"; items: string[]; source: ProficiencySource }
  | ({
      kind: "choose";
      from: string[];
      count: number;
      source: ProficiencySource;
    } & ConditionalPick)
  | ({
      kind: "any";
      count: number;
      /** Display label, e.g. "Standard language" or "Artisan's tool". */
      label: string;
      /** When set, player picks from this list; otherwise freeform entry. */
      options?: string[];
      source: ProficiencySource;
    } & ConditionalPick);

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
