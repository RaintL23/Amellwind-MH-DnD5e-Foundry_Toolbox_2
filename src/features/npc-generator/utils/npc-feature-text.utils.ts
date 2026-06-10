import type { Species } from "@/shared/types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Capitalize subject ref when it starts a sentence. */
export function formatSubjectAtSentenceStart(subjectRef: string): string {
  if (!subjectRef) return subjectRef;
  if (subjectRef.startsWith("the ")) {
    return `T${subjectRef.slice(1)}`;
  }
  return subjectRef.charAt(0).toUpperCase() + subjectRef.slice(1);
}

/**
 * Build the pronoun-replacement subject reference for a generated NPC.
 *
 * With a custom name ("Kael") → "Kael"
 * Without → "the Dragonborn Knight" / "the Kushala Daora warden"
 */
export function buildNpcSubjectRef(
  customName: string,
  species: Species,
  template: NpcTemplate,
): string {
  if (customName.trim()) return customName.trim();
  return `the ${species.name} ${template.name.toLowerCase()}`;
}

const TEMPLATE_ROLE_NOUN_PATTERN =
  /\b[Tt]he ([a-z]+(?:\s+[a-z]+)?)\s+(?:has|is|are|can|adds|knows|deals|must|makes|casts|utter)\b/g;

/** Role nouns used in template trait/reaction prose (e.g. "knight", "war chanter"). */
export function getTemplateRoleNouns(template: NpcTemplate): string[] {
  const nouns = new Set<string>();

  const srdName = template.srdReference.split("|")[0]?.trim();
  if (srdName) nouns.add(srdName.toLowerCase());

  const lastWord = template.name.split(/\s+/).pop()?.toLowerCase();
  if (lastWord) nouns.add(lastWord);

  const texts: string[] = [];
  for (const trait of template.traits) texts.push(...trait.entries);
  for (const reaction of template.reactions ?? []) texts.push(...reaction.entries);

  for (const text of texts) {
    for (const match of text.matchAll(TEMPLATE_ROLE_NOUN_PATTERN)) {
      nouns.add(match[1].toLowerCase());
    }
  }

  return [...nouns];
}

function replaceTemplateRoleNouns(
  text: string,
  subjectRef: string,
  roleNouns: string[],
): string {
  const sorted = [...roleNouns].sort((a, b) => b.length - a.length);

  let result = text;
  for (const noun of sorted) {
    const escaped = escapeRegex(noun);
    result = result.replace(
      new RegExp(`\\bThe ${escaped}\\b`, "g"),
      formatSubjectAtSentenceStart(subjectRef),
    );
    result = result.replace(
      new RegExp(`\\bthe ${escaped}\\b`, "g"),
      subjectRef,
    );
  }
  return result;
}

/**
 * Rewrite feature text sourced from species/background/template/weapon data
 * into third-person NPC prose for the generated stat block.
 *
 * E.g. "You can breathe fire"     → "Kael can breathe fire"
 *      "The knight has advantage" → "Fiora has advantage"
 *      "{@condition frightened}"  → "frightened"
 */
export function toNpcFeatureText(
  text: string,
  subjectRef: string,
  roleNouns: string[] = [],
): string {
  let result = parseFiveToolsMarkup(text);

  if (roleNouns.length > 0) {
    result = replaceTemplateRoleNouns(result, subjectRef, roleNouns);
  }

  // Multi-word phrases first (order matters to avoid partial replacements)
  result = result.replace(/\byou and all allies\b/gi, `${subjectRef} and each ally`);
  result = result.replace(/\byou,\s*and all allies\b/gi, `${subjectRef} and each ally`);
  result = result.replace(/\byou are\b/gi, `${subjectRef} is`);
  result = result.replace(/\byou have\b/gi, `${subjectRef} has`);
  result = result.replace(/\byou can\b/gi, `${subjectRef} can`);
  result = result.replace(/\byou gain\b/gi, `${subjectRef} gains`);
  result = result.replace(/\byou deal\b/gi, `${subjectRef} deals`);
  result = result.replace(/\byou take\b/gi, `${subjectRef} takes`);
  result = result.replace(/\byou make\b/gi, `${subjectRef} makes`);
  result = result.replace(/\byou roll\b/gi, `${subjectRef} rolls`);
  result = result.replace(/\byou use\b/gi, `${subjectRef} uses`);
  result = result.replace(/\byou ignore\b/gi, `${subjectRef} ignores`);

  // Generic fallbacks
  result = result.replace(/\byou\b/gi, subjectRef);
  result = result.replace(/\byour\b/gi, `${subjectRef}'s`);
  result = result.replace(/\byourself\b/gi, `${subjectRef}self`);

  return result.charAt(0).toUpperCase() + result.slice(1);
}
