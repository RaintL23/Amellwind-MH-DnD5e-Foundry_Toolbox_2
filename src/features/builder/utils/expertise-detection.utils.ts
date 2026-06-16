import type { Class } from "@/shared/types";
import type { ExpertiseGrant } from "@/shared/types/proficiency.types";
import type { ProficiencySource } from "@/shared/types/proficiency.types";

interface ExpertiseRule {
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

function getExpertiseRulesForClass(
  className: string,
  source: string,
  characterLevel: number,
): ExpertiseRule[] {
  const key = `${className.toLowerCase()}::${source.toLowerCase()}`;
  const rules = EXPERTISE_TABLE[key] ?? [];
  return rules.filter((r) => r.level <= characterLevel);
}

const COUNT_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
};

function parseCountFromText(text: string): number | null {
  const m = text.match(
    /choose\s+(one|two|three|four|\d+)\s+(?:more\s+)?(?:skills?|proficien)/i,
  );
  if (m) return COUNT_WORDS[m[1].toLowerCase()] ?? null;
  return null;
}

/**
 * Hybrid detection: scan class features named "Expertise" up to characterLevel,
 * try to parse count from description text, fall back to the hard-coded table.
 */
export function detectExpertiseGrants(
  classData: Class,
  characterLevel: number,
): ExpertiseGrant[] {
  const grants: ExpertiseGrant[] = [];

  // Auto-detect from feature names
  const expertiseFeatures = classData.progression
    .filter((row) => row.level <= characterLevel)
    .flatMap((row) => row.features)
    .filter((f) => /^expertise$/i.test(f.name.trim()));

  if (expertiseFeatures.length > 0) {
    for (const feature of expertiseFeatures) {
      const fullText = feature.description.join(" ");
      const count = parseCountFromText(fullText) ?? 2; // default 2 if parsing fails
      grants.push({
        kind: "chooseProficient",
        count,
        source: {
          type: "feature",
          name: `Expertise (${classData.name}, lvl ${feature.level})`,
        },
      });
    }
    return grants;
  }

  // Fallback: hard-coded table
  const fallback = getExpertiseRulesForClass(
    classData.name,
    classData.source,
    characterLevel,
  );
  for (const rule of fallback) {
    grants.push({
      kind: "chooseProficient",
      count: rule.count,
      source: rule.source,
    });
  }

  return grants;
}
