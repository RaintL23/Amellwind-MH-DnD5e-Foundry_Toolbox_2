import type { ProficiencySource } from "@/shared/types/proficiency.types";

export interface ExpertiseRule {
  level: number;
  count: number;
  source: ProficiencySource;
}

/** Fallback expertise rules indexed by `${classNameLower}::${source}` */
const EXPERTISE_TABLE: Record<string, ExpertiseRule[]> = {
  "rogue::phb": [
    { level: 1, count: 2, source: { type: "feature", name: "Expertise (Rogue)" } },
    { level: 6, count: 2, source: { type: "feature", name: "Expertise (Rogue, lvl 6)" } },
  ],
  "rogue::xphb": [
    { level: 1, count: 2, source: { type: "feature", name: "Expertise (Rogue)" } },
    { level: 6, count: 2, source: { type: "feature", name: "Expertise (Rogue, lvl 6)" } },
  ],
  "bard::phb": [
    { level: 3, count: 2, source: { type: "feature", name: "Expertise (Bard)" } },
    { level: 10, count: 2, source: { type: "feature", name: "Expertise (Bard, lvl 10)" } },
  ],
  "bard::xphb": [
    { level: 2, count: 2, source: { type: "feature", name: "Expertise (Bard)" } },
    { level: 9, count: 2, source: { type: "feature", name: "Expertise (Bard, lvl 9)" } },
  ],
};

/**
 * Returns expertise rules that apply at or below `characterLevel`
 * for the given class name + source.
 */
export function getExpertiseRulesForClass(
  className: string,
  source: string,
  characterLevel: number,
): ExpertiseRule[] {
  const key = `${className.toLowerCase()}::${source.toLowerCase()}`;
  const rules = EXPERTISE_TABLE[key] ?? [];
  return rules.filter((r) => r.level <= characterLevel);
}
