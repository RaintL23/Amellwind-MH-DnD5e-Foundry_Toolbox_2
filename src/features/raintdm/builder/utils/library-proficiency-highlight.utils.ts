/**
 * Detects proficiency-granting language in Library descriptions so traits /
 * features / feat paragraphs can be visually marked for the builder.
 */
import { SKILL_LABELS } from "@/shared/constants/dnd";
import type {
  NamedProficiencyGrant,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import { parseEntriesProficiencyGrants } from "@/shared/utils/text-proficiency-grants.parser";

const PROFICIENCY_GRANT_HINT_RE =
  /\b(?:(?:you|your character)\s+)?(?:also\s+)?(?:gain|gains|have|has|obtain|obtains|grant|grants|give|gives)\s+(?:proficiency|proficiencies|expertise)\b|\bproficient\s+(?:with|in)\b|\b(?:training|trained)\s+(?:with|in)\b|\b(?:proficiency|proficiencies)\s+(?:with|in)\b|\bof your choice\b.{0,40}\b(?:tool|weapon|language|instrument|gaming)|(?:artisan'?s?\s+tools?|martial\s+weapons?|simple\s+weapons?|musical\s+instruments?|gaming\s+sets?)\s+of your choice\b/i;

const DUMMY_SOURCE = { type: "feature" as const, name: "library" };

/** True when plain text describes gaining a proficiency (not just "proficiency bonus"). */
export function textMentionsProficiencyGrant(text: string): boolean {
  if (!text.trim()) return false;
  const cleaned = text.replace(/\bproficiency\s+bonus(?:es)?\b/gi, " ");
  if (PROFICIENCY_GRANT_HINT_RE.test(cleaned)) return true;

  const parsed = parseEntriesProficiencyGrants([cleaned], DUMMY_SOURCE);
  return (
    parsed.armorGrants.length > 0 ||
    parsed.weaponGrants.length > 0 ||
    parsed.toolGrants.length > 0
  );
}

export function entriesMentionProficiencyGrant(
  entries: readonly string[] | undefined | null,
): boolean {
  if (!entries?.length) return false;
  return entries.some((entry) => textMentionsProficiencyGrant(entry));
}

export function formatNamedProficiencyGrant(
  grant: NamedProficiencyGrant,
): string {
  if (grant.kind === "fixed") return grant.items.join(", ");
  if (grant.kind === "choose") {
    return `Choose ${grant.count} from: ${grant.from.join(", ")}`;
  }
  return `Choose ${grant.count} ${grant.label}`;
}

export function formatSkillProficiencyGrant(
  grant: SkillProficiencyGrant,
): string {
  if (grant.kind === "fixed") {
    return grant.skills.map((s) => SKILL_LABELS[s] ?? s).join(", ");
  }
  if (grant.kind === "choose") {
    const from = grant.from.map((s) => SKILL_LABELS[s] ?? s).join(", ");
    return `Choose ${grant.count} from: ${from}`;
  }
  return `Choose ${grant.count} skill${grant.count > 1 ? "s" : ""}`;
}

export interface LibraryProficiencySummaryRow {
  label: string;
  value: string;
}

export function buildNamedGrantSummaryRows(
  label: string,
  grants: NamedProficiencyGrant[] | undefined | null,
): LibraryProficiencySummaryRow[] {
  if (!grants?.length) return [];
  const value = grants.map(formatNamedProficiencyGrant).join("; ");
  return value ? [{ label, value }] : [];
}

export function buildSkillGrantSummaryRows(
  grants: SkillProficiencyGrant[] | undefined | null,
): LibraryProficiencySummaryRow[] {
  if (!grants?.length) return [];
  const value = grants.map(formatSkillProficiencyGrant).join("; ");
  return value ? [{ label: "Skills", value }] : [];
}
