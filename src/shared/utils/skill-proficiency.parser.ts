/**
 * Shared parser for 5etools-style skillProficiencies / expertise blocks.
 * Used by class, background, species, dnd-race, and feat mappers.
 */
import type { AbilityKey, SkillKey } from "@/shared/types";
import type {
  SkillProficiencyGrant,
  ExpertiseGrant,
  ProficiencySource,
  SaveProficiencyGrant,
  SkillAdvantageGrant,
} from "@/shared/types/proficiency.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export const SKILL_NAME_TO_KEY: Record<string, SkillKey> = {
  acrobatics: "acr",
  "animal handling": "ani",
  arcana: "arc",
  athletics: "ath",
  deception: "dec",
  history: "his",
  insight: "ins",
  intimidation: "itm",
  investigation: "inv",
  medicine: "med",
  nature: "nat",
  perception: "prc",
  performance: "prf",
  persuasion: "per",
  religion: "rel",
  "sleight of hand": "slt",
  stealth: "ste",
  survival: "sur",
};

const ALL_SKILL_KEYS = Object.values(SKILL_NAME_TO_KEY) as SkillKey[];

const ABILITY_NAME_TO_KEY: Record<string, AbilityKey> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
  str: "str",
  dex: "dex",
  con: "con",
  int: "int",
  wis: "wis",
  cha: "cha",
};

function toSkillKey(name: string): SkillKey | null {
  const normalized = name.trim().toLowerCase().replace(/[{}@|]/g, "");
  // strip 5etools markup like "{@skill Acrobatics|XPHB}"
  const clean = normalized.replace(/skill\s+/i, "").trim();
  return SKILL_NAME_TO_KEY[clean] ?? SKILL_NAME_TO_KEY[normalized] ?? null;
}

/**
 * Parse a 5etools skillProficiencies block into structured grants.
 * Handles: { insight: true }, { choose: { from, count } }, { any: N }, "anySkill"
 */
export function parseSkillProficiencyBlocks(
  blocks: unknown[],
  source: ProficiencySource,
): SkillProficiencyGrant[] {
  const grants: SkillProficiencyGrant[] = [];
  if (!Array.isArray(blocks)) return grants;

  for (const block of blocks) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;

    const fixedSkills: SkillKey[] = [];

    for (const [key, value] of Object.entries(b)) {
      if (key === "choose" || key === "_") continue;

      // "anySkill": N → any N skills
      if ((key === "anySkill" || key === "any") && typeof value === "number") {
        grants.push({ kind: "any", count: value, source });
        continue;
      }

      if (value === true) {
        const sk = toSkillKey(key);
        if (sk) fixedSkills.push(sk);
      }
    }

    if (fixedSkills.length) {
      grants.push({ kind: "fixed", skills: fixedSkills, source });
    }

    // choose block
    const choose = b.choose as Raw | undefined;
    if (choose) {
      if (Array.isArray(choose.from)) {
        const from = (choose.from as unknown[])
          .map((s) => toSkillKey(String(s)))
          .filter(Boolean) as SkillKey[];
        if (from.length) {
          grants.push({
            kind: "choose",
            from,
            count: typeof choose.count === "number" ? choose.count : 1,
            source,
          });
        }
      } else if (
        choose.from === "anySkill" ||
        typeof choose.anySkill === "number"
      ) {
        grants.push({
          kind: "any",
          count: typeof choose.count === "number" ? choose.count : 1,
          source,
        });
      }
    }
  }

  return grants;
}

/**
 * Parse 5etools expertise blocks into structured expertise grants.
 */
export function parseExpertiseBlocks(
  blocks: unknown[],
  source: ProficiencySource,
): ExpertiseGrant[] {
  const grants: ExpertiseGrant[] = [];
  if (!Array.isArray(blocks)) return grants;

  for (const block of blocks) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;

    // anyProficientSkill: N
    if (typeof b.anyProficientSkill === "number") {
      grants.push({ kind: "chooseProficient", count: b.anyProficientSkill, source });
      continue;
    }

    const fixed: SkillKey[] = [];
    for (const [key, value] of Object.entries(b)) {
      if (value === true) {
        const sk = toSkillKey(key);
        if (sk) fixed.push(sk);
      }
    }
    if (fixed.length) {
      grants.push({ kind: "fixed", skills: fixed, source });
    }
  }

  return grants;
}

/**
 * Parse class raw proficiency array (ability abbreviations) into save grants.
 */
export function parseSaveProficiencies(
  raw: unknown[],
  source: ProficiencySource,
): SaveProficiencyGrant | null {
  if (!Array.isArray(raw) || !raw.length) return null;
  const abilities = (raw as unknown[])
    .map((v) => ABILITY_NAME_TO_KEY[String(v).toLowerCase()])
    .filter(Boolean) as AbilityKey[];
  return abilities.length ? { abilities, source } : null;
}

/**
 * Detect advantage/disadvantage grants on specific skills from trait text.
 * Supports 5etools markup like {@skill Perception|XPHB}.
 */
export function parseSkillAdvantagesFromTraits(
  traits: Array<{ name: string; entries: string[] }>,
  source: ProficiencySource,
): SkillAdvantageGrant[] {
  const grants: SkillAdvantageGrant[] = [];

  for (const trait of traits) {
    const fullText = trait.entries.join(" ").toLowerCase();

    // Check if the trait mentions advantage or disadvantage on skill checks
    const isAdvantage =
      fullText.includes("advantage on") && fullText.includes("check");
    const isDisadvantage =
      fullText.includes("disadvantage on") && fullText.includes("check");

    if (!isAdvantage && !isDisadvantage) continue;

    // Extract skill references: {@skill X} or plain skill name
    const skillMarkupRegex = /\{@skill\s+([\w\s]+?)(?:\|[^}]*)?\}/gi;
    const foundSkills = new Set<SkillKey>();

    let m: RegExpExecArray | null;
    while ((m = skillMarkupRegex.exec(trait.entries.join(" "))) !== null) {
      const sk = toSkillKey(m[1]);
      if (sk) foundSkills.add(sk);
    }

    // Fallback: scan for plain skill names in the text
    if (!foundSkills.size) {
      for (const [name, key] of Object.entries(SKILL_NAME_TO_KEY)) {
        if (fullText.includes(name)) foundSkills.add(key);
      }
    }

    // Extract condition phrase (text after "in")
    const conditionMatch = fullText.match(
      /(?:advantage|disadvantage) on .+? checks?(?: made)? (.+)/,
    );
    const condition = conditionMatch
      ? conditionMatch[1].replace(/\.$/, "").trim()
      : "";

    for (const skill of foundSkills) {
      grants.push({
        skill,
        kind: isDisadvantage ? "disadvantage" : "advantage",
        condition,
        source: { ...source, name: `${source.name} — ${trait.name}` },
      });
    }
  }

  return grants;
}

/**
 * Parse skillToolLanguageProficiencies (feat-specific format).
 */
export function parseSkillToolLanguageProficiencies(
  blocks: unknown[],
  source: ProficiencySource,
): SkillProficiencyGrant[] {
  const grants: SkillProficiencyGrant[] = [];
  if (!Array.isArray(blocks)) return grants;

  for (const block of blocks) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Raw;

    // choose: [{ from: ["anySkill", "anyTool", ...], count: N }]
    if (Array.isArray(b.choose)) {
      for (const choice of b.choose as Raw[]) {
        if (!Array.isArray(choice.from)) continue;
        const skillOptions = (choice.from as string[]).filter(
          (v) => v === "anySkill" || toSkillKey(v) !== null,
        );
        if (!skillOptions.length) continue;

        const allAny = skillOptions.every((v) => v === "anySkill");
        if (allAny) {
          grants.push({
            kind: "any",
            count: typeof choice.count === "number" ? choice.count : 1,
            source,
          });
        } else {
          const from = skillOptions
            .filter((v) => v !== "anySkill")
            .map(toSkillKey)
            .filter(Boolean) as SkillKey[];
          const anyCount = skillOptions.filter((v) => v === "anySkill").length;
          if (from.length) {
            grants.push({
              kind: "choose",
              from: anyCount > 0 ? ALL_SKILL_KEYS : from,
              count: typeof choice.count === "number" ? choice.count : 1,
              source,
            });
          }
        }
      }
    }
  }

  return grants;
}
