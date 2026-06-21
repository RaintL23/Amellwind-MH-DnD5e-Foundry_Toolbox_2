import type { Class, ClassFeatureEntry, SkillKey } from "@/shared/types";
import type { ExpertiseGrant } from "@/shared/types/proficiency.types";
import type { ProficiencySource } from "@/shared/types/proficiency.types";
import { SKILL_NAME_TO_KEY } from "@/shared/utils/skill-proficiency.parser";

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

function toSkillKey(name: string): SkillKey | null {
  const normalized = name.trim().toLowerCase().replace(/[{}@|]/g, "");
  const clean = normalized.replace(/skill\s+/i, "").trim();
  return SKILL_NAME_TO_KEY[clean] ?? SKILL_NAME_TO_KEY[normalized] ?? null;
}

function extractSkillsFromText(text: string): SkillKey[] {
  const found = new Set<SkillKey>();
  const skillMarkupRegex = /\{@skill\s+([\w\s]+?)(?:\|[^}]*)?\}/gi;
  let match: RegExpExecArray | null;
  while ((match = skillMarkupRegex.exec(text)) !== null) {
    const skill = toSkillKey(match[1]);
    if (skill) found.add(skill);
  }
  return [...found];
}

function parseCountFromText(text: string): number | null {
  const match = text.match(
    /choose\s+(one|two|three|four|\d+)\s+(?:more\s+)?(?:skills?|proficien)/i,
  );
  if (match) return COUNT_WORDS[match[1].toLowerCase()] ?? null;
  return null;
}

function featureSourceName(feature: ClassFeatureEntry, className: string): string {
  const label = feature.displayName?.trim() || feature.name.trim();
  return `${label} (${className}, lvl ${feature.level})`;
}

/**
 * Wizard Scholar and similar features: choose N from a listed skill pool
 * among skills you are already proficient in, then gain Expertise in that pick.
 */
function parseListedProficientExpertiseGrant(
  feature: ClassFeatureEntry,
  className: string,
): ExpertiseGrant | null {
  const fullText = feature.description.join(" ");

  const listedProficientMatch = fullText.match(
    /choose\s+(one|two|three|four|\d+)\s+of\s+the\s+following\s+skills?\s+in\s+which\s+you\s+have\s+proficiency/i,
  );
  if (!listedProficientMatch) return null;

  const hasExpertise =
    fullText.includes("{@variantrule Expertise") ||
    /\bexpertise\b[^.]*\bchosen\s+skill/i.test(fullText);
  if (!hasExpertise) return null;

  const from = extractSkillsFromText(fullText);
  if (!from.length) return null;

  const count = COUNT_WORDS[listedProficientMatch[1].toLowerCase()] ?? 1;

  return {
    kind: "chooseProficient",
    count,
    from,
    source: {
      type: "feature",
      name: featureSourceName(feature, className),
    },
  };
}

/**
 * Hybrid detection: scan class features named "Expertise" up to characterLevel,
 * try to parse count from description text, fall back to the hard-coded table,
 * and detect other features (e.g. Wizard Scholar) that grant expertise on a chosen skill.
 */
export function detectExpertiseGrants(
  classData: Class,
  characterLevel: number,
): ExpertiseGrant[] {
  const grants: ExpertiseGrant[] = [];

  const features = classData.progression
    .filter((row) => row.level <= characterLevel)
    .flatMap((row) => row.features);

  const expertiseFeatures = features.filter((feature) =>
    /^expertise$/i.test(feature.name.trim()),
  );

  if (expertiseFeatures.length > 0) {
    for (const feature of expertiseFeatures) {
      const fullText = feature.description.join(" ");
      const count = parseCountFromText(fullText) ?? 2;
      grants.push({
        kind: "chooseProficient",
        count,
        source: {
          type: "feature",
          name: featureSourceName(feature, classData.name),
        },
      });
    }
  } else {
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
  }

  for (const feature of features) {
    if (/^expertise$/i.test(feature.name.trim())) continue;
    const parsed = parseListedProficientExpertiseGrant(feature, classData.name);
    if (parsed) grants.push(parsed);
  }

  return grants;
}
