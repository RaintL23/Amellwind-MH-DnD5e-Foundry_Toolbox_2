import {
  Feat,
  FeatAbilityIncrease,
  FeatPrerequisiteAbilityReq,
  FeatPrerequisiteCheckGroup,
  FeatPrerequisiteKind,
  FeatSection,
  type AbilityKey,
} from "@/shared/types";
import {
  FEAT_ENTRY_OPTIONS,
  parseFiveToolsMarkup,
  renderFiveToolsEntries,
} from "@/shared/utils/fivetools-parser";
import {
  ABILITY_ABBREVIATIONS,
  ABILITY_KEYS,
  toAbilityKey,
} from "@/shared/constants/dnd";
import {
  parseSkillProficiencyBlocks,
  parseExpertiseBlocks,
  parseSkillToolLanguageProficiencies,
} from "@/shared/utils/skill-proficiency.parser";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types/dnd-feat.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const ABILITY_LABELS: Record<string, string> = ABILITY_ABBREVIATIONS;

function featId(raw: Raw): string {
  return `${raw.name}::${raw.source}`;
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** 5etools uid: `name|source|displayName` → best human label. */
function formatEntityRef(raw: string): string {
  const parts = String(raw)
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  const display = parts[2] ?? parts[0] ?? String(raw);
  return titleCaseWords(display);
}

function abilityKeyFromUnknown(key: string): AbilityKey | null {
  return toAbilityKey(key);
}

function mapAbilityIncreases(raw: Raw): FeatAbilityIncrease[] {
  if (!Array.isArray(raw.ability)) return [];

  const result: FeatAbilityIncrease[] = [];

  for (const block of raw.ability as Raw[]) {
    const choose = block.choose as Raw | undefined;
    if (choose && Array.isArray(choose.from)) {
      const fromKeys = (choose.from as string[])
        .map((k) => abilityKeyFromUnknown(k))
        .filter((k): k is AbilityKey => k != null);
      const abilities =
        fromKeys.length > 0
          ? fromKeys
          : ([...ABILITY_KEYS] as AbilityKey[]);
      const labels = abilities.map((k) => ABILITY_LABELS[k] ?? k.toUpperCase());
      const amount = typeof choose.amount === "number" ? choose.amount : 1;
      result.push({
        label: `${labels.join(" or ")} +${amount} (choose)`,
        abilities,
      });
      continue;
    }

    for (const [key, value] of Object.entries(block)) {
      if (key === "choose" || key === "max" || key === "hidden") continue;
      const ability = abilityKeyFromUnknown(key);
      const label = ability ? ABILITY_LABELS[ability] : undefined;
      if (ability && label && typeof value === "number") {
        result.push({ label: `${label} +${value}`, abilities: [ability] });
      }
    }
  }

  return result;
}

interface MappedPrerequisites {
  labels: string[];
  kinds: FeatPrerequisiteKind[];
  levels: number[];
  checkGroups: FeatPrerequisiteCheckGroup[];
}

function pushPrereq(
  out: MappedPrerequisites,
  kind: FeatPrerequisiteKind,
  label: string,
) {
  const trimmed = label.trim();
  if (!trimmed) return;
  if (!out.labels.includes(trimmed)) out.labels.push(trimmed);
  if (!out.kinds.includes(kind)) out.kinds.push(kind);
}

function pushLevelPrereq(
  out: MappedPrerequisites,
  level: number,
  label: string,
) {
  pushPrereq(out, "level", label);
  if (!out.levels.includes(level)) out.levels.push(level);
}

function mapAbilityAlternatives(
  abilityBlocks: Raw[],
): FeatPrerequisiteAbilityReq[][] {
  const alternatives: FeatPrerequisiteAbilityReq[][] = [];
  for (const ab of abilityBlocks) {
    const reqs: FeatPrerequisiteAbilityReq[] = [];
    for (const [key, value] of Object.entries(ab)) {
      const ability = abilityKeyFromUnknown(key);
      if (ability && typeof value === "number") {
        reqs.push({ ability, min: value });
      }
    }
    if (reqs.length > 0) alternatives.push(reqs);
  }
  return alternatives;
}

function formatProficiency(entry: Raw): string | null {
  if (typeof entry.weapon === "string") {
    return `${titleCaseWords(entry.weapon)} Weapon Proficiency`;
  }
  if (typeof entry.armor === "string") {
    return `${titleCaseWords(entry.armor)} Armor Proficiency`;
  }
  if (typeof entry.shield === "boolean" && entry.shield) {
    return "Shield Proficiency";
  }
  if (typeof entry.weaponGroup === "string") {
    return `${titleCaseWords(entry.weaponGroup)} Weapon Proficiency`;
  }
  if (typeof entry.skill === "string") {
    return `${titleCaseWords(entry.skill)} Proficiency`;
  }
  if (typeof entry.tool === "string") {
    return `${titleCaseWords(entry.tool)} Proficiency`;
  }
  return null;
}

function formatCategoryCode(code: string): string {
  return DND_FEAT_CATEGORY_LABELS[code] ?? code;
}

function mapPrerequisites(raw: Raw): MappedPrerequisites {
  const out: MappedPrerequisites = {
    labels: [],
    kinds: [],
    levels: [],
    checkGroups: [],
  };
  if (!Array.isArray(raw.prerequisite)) return out;

  for (const prereq of raw.prerequisite as Raw[]) {
    const checkGroup: FeatPrerequisiteCheckGroup = {
      abilityAlternatives: [],
      hasUnverifiedRequirements: false,
    };
    let groupTouched = false;

    if (Array.isArray(prereq.ability)) {
      const alternatives = mapAbilityAlternatives(prereq.ability as Raw[]);
      checkGroup.abilityAlternatives = alternatives;
      if (alternatives.length > 0) groupTouched = true;
      for (const alt of alternatives) {
        for (const req of alt) {
          const label = ABILITY_LABELS[req.ability];
          if (label) pushPrereq(out, "ability", `${label} ${req.min}+`);
        }
      }
    }

    if (typeof prereq.level === "number") {
      pushLevelPrereq(out, prereq.level, `Level ${prereq.level}+`);
      checkGroup.level = prereq.level;
      groupTouched = true;
    } else if (prereq.level && typeof prereq.level === "object") {
      const levelObj = prereq.level as Raw;
      const level =
        typeof levelObj.level === "number" ? levelObj.level : undefined;
      const className =
        typeof levelObj.class === "object" && levelObj.class
          ? String((levelObj.class as Raw).name ?? "").trim()
          : "";
      if (level != null) {
        pushLevelPrereq(
          out,
          level,
          className
            ? `${titleCaseWords(className)} Level ${level}+`
            : `Level ${level}+`,
        );
        checkGroup.level = level;
        groupTouched = true;
        // Class-gated level prereqs need class matching beyond raw level.
        if (className) checkGroup.hasUnverifiedRequirements = true;
      }
    }

    if (Array.isArray(prereq.race)) {
      for (const race of prereq.race as Raw[]) {
        const name =
          typeof race?.name === "string"
            ? race.name
            : typeof race === "string"
              ? race
              : "";
        if (name) {
          pushPrereq(out, "race", titleCaseWords(name));
          checkGroup.hasUnverifiedRequirements = true;
          groupTouched = true;
        }
      }
    }

    if (Array.isArray(prereq.feat)) {
      for (const feat of prereq.feat as unknown[]) {
        if (typeof feat === "string") {
          pushPrereq(out, "feat", formatEntityRef(feat));
          checkGroup.hasUnverifiedRequirements = true;
          groupTouched = true;
        }
      }
    }

    if (Array.isArray(prereq.feature)) {
      for (const feature of prereq.feature as unknown[]) {
        if (typeof feature === "string") {
          pushPrereq(out, "feature", formatEntityRef(feature));
          checkGroup.hasUnverifiedRequirements = true;
          groupTouched = true;
        }
      }
    }

    if (Array.isArray(prereq.proficiency)) {
      for (const prof of prereq.proficiency as Raw[]) {
        const label = formatProficiency(prof);
        if (label) {
          pushPrereq(out, "proficiency", label);
          checkGroup.hasUnverifiedRequirements = true;
          groupTouched = true;
        }
      }
    }

    if (
      prereq.spellcasting === true ||
      prereq.spellcasting2020 === true ||
      prereq.spellcastingFeature === true
    ) {
      pushPrereq(out, "spellcasting", "Spellcasting");
      checkGroup.hasUnverifiedRequirements = true;
      groupTouched = true;
    }

    if (Array.isArray(prereq.campaign)) {
      for (const campaign of prereq.campaign as unknown[]) {
        if (typeof campaign === "string" && campaign.trim()) {
          pushPrereq(out, "campaign", campaign.trim());
          checkGroup.hasUnverifiedRequirements = true;
          groupTouched = true;
        }
      }
    }

    if (Array.isArray(prereq.background)) {
      for (const bg of prereq.background as Raw[]) {
        if (typeof bg?.displayEntry === "string" && bg.displayEntry.trim()) {
          pushPrereq(
            out,
            "background",
            parseFiveToolsMarkup(bg.displayEntry).trim(),
          );
          checkGroup.hasUnverifiedRequirements = true;
          groupTouched = true;
        } else if (typeof bg?.name === "string" && bg.name.trim()) {
          pushPrereq(out, "background", titleCaseWords(bg.name));
          checkGroup.hasUnverifiedRequirements = true;
          groupTouched = true;
        }
      }
    }

    for (const key of ["exclusiveFeatCategory", "featCategory"] as const) {
      if (Array.isArray(prereq[key])) {
        for (const code of prereq[key] as unknown[]) {
          if (typeof code === "string" && code.trim()) {
            pushPrereq(
              out,
              "other",
              `${formatCategoryCode(code.trim())} Feat`,
            );
            checkGroup.hasUnverifiedRequirements = true;
            groupTouched = true;
          }
        }
      }
    }

    if (typeof prereq.otherSummary === "object" && prereq.otherSummary) {
      const summary = prereq.otherSummary as Raw;
      const entry =
        typeof summary.entrySummary === "string" && summary.entrySummary.trim()
          ? summary.entrySummary.trim()
          : typeof summary.entry === "string"
            ? parseFiveToolsMarkup(summary.entry).trim()
            : "";
      if (entry) {
        pushPrereq(out, "other", entry);
        checkGroup.hasUnverifiedRequirements = true;
        groupTouched = true;
      }
    }

    if (typeof prereq.other === "string" && prereq.other.trim()) {
      pushPrereq(out, "other", prereq.other.trim());
      checkGroup.hasUnverifiedRequirements = true;
      groupTouched = true;
    }

    if (groupTouched) out.checkGroups.push(checkGroup);
  }

  return out;
}

function splitSections(paragraphs: string[]): {
  lead: string[];
  sections: FeatSection[];
} {
  const lead: string[] = [];
  const sections: FeatSection[] = [];
  let current: FeatSection | null = null;

  for (const line of paragraphs) {
    const isHeader = /^\*\*.+\*\*$/.test(line);
    if (isHeader) {
      if (current && current.paragraphs.length) sections.push(current);
      current = {
        name: line.replace(/^\*\*|\*\*$/g, ""),
        paragraphs: [],
      };
    } else if (current) {
      current.paragraphs.push(line);
    } else {
      lead.push(line);
    }
  }

  if (current && (current.name || current.paragraphs.length)) {
    sections.push(current);
  }

  return { lead, sections };
}

function buildSummary(
  prerequisites: string[],
  abilityIncreases: FeatAbilityIncrease[],
  paragraphs: string[],
): string {
  const parts: string[] = [];
  if (prerequisites.length) parts.push(prerequisites.join(" · "));
  if (abilityIncreases.length) {
    parts.push(abilityIncreases.map((a) => a.label).join(", "));
  }
  const first = paragraphs.find((p) => !p.startsWith("•") && !p.startsWith("»"));
  if (first) parts.push(first.slice(0, 120) + (first.length > 120 ? "…" : ""));
  return parts.join(" — ") || "";
}

const REPEATABLE_PATTERN = /can select this feat multiple times/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFeat(raw: any): Feat {
  const entries = Array.isArray(raw.entries) ? (raw.entries as unknown[]) : [];
  const allParagraphs = renderFiveToolsEntries(entries, FEAT_ENTRY_OPTIONS);
  const { lead, sections } = splitSections(allParagraphs);
  const {
    labels: prerequisites,
    kinds: prerequisiteKinds,
    levels: prerequisiteLevels,
    checkGroups: prerequisiteCheckGroups,
  } = mapPrerequisites(raw);
  const abilityIncreases = mapAbilityIncreases(raw);
  const repeatable =
    raw.repeatable === true ||
    allParagraphs.some((p) => REPEATABLE_PATTERN.test(p));

  const featSource = { type: "feat" as const, name: String(raw.name ?? "Unknown") };
  const skillGrants = [
    ...parseSkillProficiencyBlocks(
      Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : [],
      featSource,
    ),
    ...parseSkillToolLanguageProficiencies(
      Array.isArray(raw.skillToolLanguageProficiencies)
        ? raw.skillToolLanguageProficiencies
        : [],
      featSource,
    ),
  ];
  const expertiseGrants = parseExpertiseBlocks(
    Array.isArray(raw.expertise) ? raw.expertise : [],
    featSource,
  );

  return {
    id: featId(raw),
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "AGMH"),
    page: typeof raw.page === "number" ? raw.page : undefined,
    prerequisites,
    prerequisiteKinds,
    prerequisiteLevels,
    prerequisiteCheckGroups,
    abilityIncreases,
    paragraphs: lead,
    sections,
    repeatable,
    summary: buildSummary(prerequisites, abilityIncreases, lead),
    skillGrants,
    expertiseGrants,
  };
}
